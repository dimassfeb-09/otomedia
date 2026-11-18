package usecase

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"taskmanager/internal/domain"
	"taskmanager/internal/repository"
)

type mockRepo struct {
	mu     sync.Mutex
	tasks  map[int64]*domain.Task
	nextID int64
}

func newMockRepo() *mockRepo {
	return &mockRepo{tasks: map[int64]*domain.Task{}, nextID: 1}
}

func (mockRepository *mockRepo) Create(ctx context.Context, task *domain.Task) error {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	for _, existingTask := range mockRepository.tasks {
		if existingTask.Title == task.Title && existingTask.DeletedAt == nil {
			return domain.ErrDuplicateTitle
		}
	}

	task.ID = mockRepository.nextID
	mockRepository.nextID++

	taskCopy := *task
	mockRepository.tasks[task.ID] = &taskCopy

	return nil
}

func (mockRepository *mockRepo) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	task, ok := mockRepository.tasks[id]
	if !ok {
		return nil, nil
	}

	taskCopy := *task

	return &taskCopy, nil
}

func (mockRepository *mockRepo) Update(ctx context.Context, task *domain.Task) error {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	for taskID, existingTask := range mockRepository.tasks {
		if taskID != task.ID && existingTask.Title == task.Title && existingTask.DeletedAt == nil {
			return domain.ErrDuplicateTitle
		}
	}

	taskCopy := *task
	mockRepository.tasks[task.ID] = &taskCopy

	return nil
}

func (mockRepository *mockRepo) SoftDelete(ctx context.Context, id int64) error {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	task, ok := mockRepository.tasks[id]
	if !ok || task.DeletedAt != nil {
		return errors.New("not found")
	}

	now := time.Now()
	task.DeletedAt = &now

	return nil
}

func (mockRepository *mockRepo) List(ctx context.Context, filter repository.TaskFilter) ([]domain.Task, int, error) {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	var filteredTasks []domain.Task

	for _, task := range mockRepository.tasks {
		if task.DeletedAt != nil {
			continue
		}

		if filter.Status != "" && string(task.Status) != filter.Status {
			continue
		}

		if filter.Assignee != "" && task.Assignee != filter.Assignee {
			continue
		}

		if filter.Keyword != "" {
			if !contains(task.Title, filter.Keyword) && !contains(task.Description, filter.Keyword) {
				continue
			}
		}

		filteredTasks = append(filteredTasks, *task)
	}

	total := len(filteredTasks)

	page := filter.Page
	if page < 1 {
		page = 1
	}

	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}

	start := (page - 1) * limit
	if start > len(filteredTasks) {
		start = len(filteredTasks)
	}

	end := start + limit
	if end > len(filteredTasks) {
		end = len(filteredTasks)
	}

	return filteredTasks[start:end], total, nil
}

func (mockRepository *mockRepo) ExistsByTitle(ctx context.Context, title string, excludeID int64) (bool, error) {
	mockRepository.mu.Lock()
	defer mockRepository.mu.Unlock()

	for taskID, task := range mockRepository.tasks {
		if excludeID > 0 && taskID == excludeID {
			continue
		}

		if task.Title == title && task.DeletedAt == nil {
			return true, nil
		}
	}

	return false, nil
}

type mockCache struct {
	mu      sync.Mutex
	store   map[string][]byte
	deletes []string
}

func newMockCache() *mockCache {
	return &mockCache{store: map[string][]byte{}}
}

func (mockCache *mockCache) Get(ctx context.Context, key string) ([]byte, error) {
	mockCache.mu.Lock()
	defer mockCache.mu.Unlock()

	value, found := mockCache.store[key]
	if !found {
		return nil, nil
	}

	copiedBytes := make([]byte, len(value))
	copy(copiedBytes, value)

	return copiedBytes, nil
}

func (mockCache *mockCache) Set(ctx context.Context, key string, value []byte, ttlSeconds int) error {
	mockCache.mu.Lock()
	defer mockCache.mu.Unlock()

	copiedBytes := make([]byte, len(value))
	copy(copiedBytes, value)
	mockCache.store[key] = copiedBytes

	return nil
}

func (mockCache *mockCache) Delete(ctx context.Context, key string) error {
	mockCache.mu.Lock()
	defer mockCache.mu.Unlock()

	delete(mockCache.store, key)

	return nil
}

func (mockCache *mockCache) DeletePrefix(ctx context.Context, prefix string) error {
	mockCache.mu.Lock()
	defer mockCache.mu.Unlock()

	for key := range mockCache.store {
		if hasPrefix(key, prefix) {
			delete(mockCache.store, key)
			mockCache.deletes = append(mockCache.deletes, key)
		}
	}

	return nil
}

func contains(text, substring string) bool {
	return len(text) >= len(substring) && (text == substring || indexContains(text, substring))
}

func indexContains(text, substring string) bool {
	for i := 0; i+len(substring) <= len(text); i++ {
		if text[i:i+len(substring)] == substring {
			return true
		}
	}

	return false
}

func hasPrefix(text, prefix string) bool {
	return len(text) >= len(prefix) && text[:len(prefix)] == prefix
}

func TestCreate(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	task, err := taskUsecase.Create(ctx, CreateTaskInput{Title: "New Task", Status: "pending", Assignee: "alice"})
	if err != nil {
		t.Fatal(err)
	}

	if task.ID == 0 || task.Title != "New Task" {
		t.Fatalf("create failed: %+v", task)
	}

	_, err = taskUsecase.Create(ctx, CreateTaskInput{Title: "New Task"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected ErrDuplicateTitle, got %v", err)
	}

	_, err = taskUsecase.Create(ctx, CreateTaskInput{Title: "   "})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation, got %v", err)
	}
}

func TestUpdate(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	task, err := taskUsecase.Create(ctx, CreateTaskInput{Title: "T1", Status: "pending"})
	if err != nil {
		t.Fatal(err)
	}

	updated, err := taskUsecase.Update(ctx, task.ID, UpdateTaskInput{Title: "T1-updated", Status: "done"})
	if err != nil {
		t.Fatal(err)
	}

	if updated.Title != "T1-updated" || updated.Status != domain.StatusDone {
		t.Fatalf("update not applied: %+v", updated)
	}

	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "T2"})

	_, err = taskUsecase.Update(ctx, task.ID, UpdateTaskInput{Title: "T2", Status: "done"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected duplicate title error, got %v", err)
	}
}

func TestSearch(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "Buy milk", Description: "groceries", Status: "pending", Assignee: "alice"})
	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "Write code", Description: "backend", Status: "done", Assignee: "bob"})

	tasks, total, err := taskUsecase.List(ctx, repository.TaskFilter{Keyword: "milk", Page: 1, Limit: 10})
	if err != nil {
		t.Fatal(err)
	}

	if total != 1 || len(tasks) != 1 {
		t.Fatalf("expected 1 result, got %d/%d", len(tasks), total)
	}

	tasks, total, err = taskUsecase.List(ctx, repository.TaskFilter{Status: "done", Page: 1, Limit: 10})
	if err != nil {
		t.Fatal(err)
	}

	if total != 1 {
		t.Fatalf("expected 1 done, got %d", total)
	}

	tasks, total, err = taskUsecase.List(ctx, repository.TaskFilter{Assignee: "alice", Page: 1, Limit: 10})
	if err != nil {
		t.Fatal(err)
	}

	if total != 1 {
		t.Fatalf("expected 1 alice, got %d", total)
	}

	_ = tasks
}

func TestCacheInvalidation(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "A"})

	_, _, _ = taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	if len(cache.store) == 0 {
		t.Fatal("cache not populated")
	}

	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "B"})
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after create, remaining %d", len(cache.store))
	}

	_, _, _ = taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})

	tasks, _, _ := taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})

	_, _ = taskUsecase.Update(ctx, tasks[0].ID, UpdateTaskInput{Title: "A2", Status: "pending"})
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after update")
	}

	_, _, _ = taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})

	tasks, _, _ = taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})

	_ = taskUsecase.SoftDelete(ctx, tasks[0].ID)
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after delete")
	}
}

func TestDuplicateTitleReturns409(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	_, _ = taskUsecase.Create(ctx, CreateTaskInput{Title: "dup"})

	_, err := taskUsecase.Create(ctx, CreateTaskInput{Title: "dup"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected ErrDuplicateTitle, got %v", err)
	}
}

func TestHideSoftDeleted(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	taskUsecase := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	task, _ := taskUsecase.Create(ctx, CreateTaskInput{Title: "delme"})

	_ = taskUsecase.SoftDelete(ctx, task.ID)

	tasks, total, _ := taskUsecase.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	if total != 0 || len(tasks) != 0 {
		t.Fatalf("soft-deleted task still visible: %d/%d", len(tasks), total)
	}

	_, err := taskUsecase.GetByID(ctx, task.ID)
	if err != domain.ErrNotFound {
		t.Fatalf("expected not found for deleted, got %v", err)
	}
}

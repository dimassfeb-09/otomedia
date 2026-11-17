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

func (m *mockRepo) Create(ctx context.Context, task *domain.Task) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, t := range m.tasks {
		if t.Title == task.Title && t.DeletedAt == nil {
			return domain.ErrDuplicateTitle
		}
	}
	task.ID = m.nextID
	m.nextID++
	cp := *task
	m.tasks[task.ID] = &cp
	return nil
}

func (m *mockRepo) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.tasks[id]
	if !ok {
		return nil, nil
	}
	cp := *t
	return &cp, nil
}

func (m *mockRepo) Update(ctx context.Context, task *domain.Task) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, t := range m.tasks {
		if id != task.ID && t.Title == task.Title && t.DeletedAt == nil {
			return domain.ErrDuplicateTitle
		}
	}
	cp := *task
	m.tasks[task.ID] = &cp
	return nil
}

func (m *mockRepo) SoftDelete(ctx context.Context, id int64) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	t, ok := m.tasks[id]
	if !ok || t.DeletedAt != nil {
		return errors.New("not found")
	}
	now := time.Now()
	t.DeletedAt = &now
	return nil
}

func (m *mockRepo) List(ctx context.Context, filter repository.TaskFilter) ([]domain.Task, int, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []domain.Task
	for _, t := range m.tasks {
		if t.DeletedAt != nil {
			continue
		}
		if filter.Status != "" && string(t.Status) != filter.Status {
			continue
		}
		if filter.Assignee != "" && t.Assignee != filter.Assignee {
			continue
		}
		if filter.Keyword != "" {
			if !contains(t.Title, filter.Keyword) && !contains(t.Description, filter.Keyword) {
				continue
			}
		}
		out = append(out, *t)
	}
	total := len(out)
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 10
	}
	start := (page - 1) * limit
	if start > len(out) {
		start = len(out)
	}
	end := start + limit
	if end > len(out) {
		end = len(out)
	}
	return out[start:end], total, nil
}

func (m *mockRepo) ExistsByTitle(ctx context.Context, title string, excludeID int64) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, t := range m.tasks {
		if excludeID > 0 && id == excludeID {
			continue
		}
		if t.Title == title && t.DeletedAt == nil {
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

func (c *mockCache) Get(ctx context.Context, key string) ([]byte, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	v, ok := c.store[key]
	if !ok {
		return nil, nil
	}
	cp := make([]byte, len(v))
	copy(cp, v)
	return cp, nil
}

func (c *mockCache) Set(ctx context.Context, key string, value []byte, ttlSeconds int) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	cp := make([]byte, len(value))
	copy(cp, value)
	c.store[key] = cp
	return nil
}

func (c *mockCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.store, key)
	return nil
}

func (c *mockCache) DeletePrefix(ctx context.Context, prefix string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	for k := range c.store {
		if hasPrefix(k, prefix) {
			delete(c.store, k)
			c.deletes = append(c.deletes, k)
		}
	}
	return nil
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || indexContains(s, sub))
}

func indexContains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func hasPrefix(s, p string) bool {
	return len(s) >= len(p) && s[:len(p)] == p
}

func TestCreate(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	task, err := uc.Create(ctx, CreateTaskInput{Title: "New Task", Status: "pending", Assignee: "alice"})
	if err != nil {
		t.Fatal(err)
	}
	if task.ID == 0 || task.Title != "New Task" {
		t.Fatalf("create failed: %+v", task)
	}
	_, err = uc.Create(ctx, CreateTaskInput{Title: "New Task"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected ErrDuplicateTitle, got %v", err)
	}
	_, err = uc.Create(ctx, CreateTaskInput{Title: "   "})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation, got %v", err)
	}
}

func TestUpdate(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	task, err := uc.Create(ctx, CreateTaskInput{Title: "T1", Status: "pending"})
	if err != nil {
		t.Fatal(err)
	}
	updated, err := uc.Update(ctx, task.ID, UpdateTaskInput{Title: "T1-updated", Status: "done"})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Title != "T1-updated" || updated.Status != domain.StatusDone {
		t.Fatalf("update not applied: %+v", updated)
	}
	_, _ = uc.Create(ctx, CreateTaskInput{Title: "T2"})
	_, err = uc.Update(ctx, task.ID, UpdateTaskInput{Title: "T2", Status: "done"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected duplicate title error, got %v", err)
	}
}

func TestSearch(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	_, _ = uc.Create(ctx, CreateTaskInput{Title: "Buy milk", Description: "groceries", Status: "pending", Assignee: "alice"})
	_, _ = uc.Create(ctx, CreateTaskInput{Title: "Write code", Description: "backend", Status: "done", Assignee: "bob"})

	tasks, total, err := uc.List(ctx, repository.TaskFilter{Keyword: "milk", Page: 1, Limit: 10})
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 || len(tasks) != 1 {
		t.Fatalf("expected 1 result, got %d/%d", len(tasks), total)
	}

	tasks, total, err = uc.List(ctx, repository.TaskFilter{Status: "done", Page: 1, Limit: 10})
	if err != nil {
		t.Fatal(err)
	}
	if total != 1 {
		t.Fatalf("expected 1 done, got %d", total)
	}

	tasks, total, err = uc.List(ctx, repository.TaskFilter{Assignee: "alice", Page: 1, Limit: 10})
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
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()

	_, _ = uc.Create(ctx, CreateTaskInput{Title: "A"})
	_, _, _ = uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	if len(cache.store) == 0 {
		t.Fatal("cache not populated")
	}
	_, _ = uc.Create(ctx, CreateTaskInput{Title: "B"})
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after create, remaining %d", len(cache.store))
	}
	_, _, _ = uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	tasks, _, _ := uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	_, _ = uc.Update(ctx, tasks[0].ID, UpdateTaskInput{Title: "A2", Status: "pending"})
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after update")
	}
	_, _, _ = uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	tasks, _, _ = uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	_ = uc.SoftDelete(ctx, tasks[0].ID)
	if len(cache.store) != 0 {
		t.Fatalf("cache not invalidated after delete")
	}
}

func TestDuplicateTitleReturns409(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()
	_, _ = uc.Create(ctx, CreateTaskInput{Title: "dup"})
	_, err := uc.Create(ctx, CreateTaskInput{Title: "dup"})
	if err != domain.ErrDuplicateTitle {
		t.Fatalf("expected ErrDuplicateTitle, got %v", err)
	}
}

func TestHideSoftDeleted(t *testing.T) {
	repo := newMockRepo()
	cache := newMockCache()
	uc := NewTaskUsecase(repo, cache)
	ctx := context.Background()
	task, _ := uc.Create(ctx, CreateTaskInput{Title: "delme"})
	_ = uc.SoftDelete(ctx, task.ID)
	tasks, total, _ := uc.List(ctx, repository.TaskFilter{Page: 1, Limit: 10})
	if total != 0 || len(tasks) != 0 {
		t.Fatalf("soft-deleted task still visible: %d/%d", len(tasks), total)
	}
	_, err := uc.GetByID(ctx, task.ID)
	if err != domain.ErrNotFound {
		t.Fatalf("expected not found for deleted, got %v", err)
	}
}

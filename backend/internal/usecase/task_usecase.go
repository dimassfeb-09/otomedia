package usecase

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"taskmanager/internal/domain"
	"taskmanager/internal/repository"
)

// TaskUsecase orchestrates task business logic.
type TaskUsecase struct {
	repo  repository.TaskRepository
	cache repository.CacheRepository
}

// NewTaskUsecase constructs a TaskUsecase.
func NewTaskUsecase(repo repository.TaskRepository, cache repository.CacheRepository) *TaskUsecase {
	return &TaskUsecase{repo: repo, cache: cache}
}

// CreateTaskInput is the input for creating a task.
type CreateTaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Assignee    string `json:"assignee"`
}

// UpdateTaskInput is the input for updating a task.
type UpdateTaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Assignee    string `json:"assignee"`
}

func (u *TaskUsecase) validateStatus(s string) (domain.TaskStatus, error) {
	status := domain.TaskStatus(s)
	if s == "" {
		status = domain.StatusPending
	}
	if !status.IsValid() {
		return "", domain.ErrInvalidStatus
	}
	return status, nil
}

func (u *TaskUsecase) Create(ctx context.Context, in CreateTaskInput) (*domain.Task, error) {
	if strings.TrimSpace(in.Title) == "" {
		return nil, domain.ErrValidation
	}
	status, err := u.validateStatus(in.Status)
	if err != nil {
		return nil, err
	}
	exists, err := u.repo.ExistsByTitle(ctx, in.Title, 0)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrDuplicateTitle
	}
	now := time.Now()
	task := &domain.Task{
		Title:       in.Title,
		Description: in.Description,
		Status:      status,
		Assignee:    in.Assignee,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := u.repo.Create(ctx, task); err != nil {
		return nil, err
	}
	u.invalidateCache(ctx)
	return task, nil
}

func (u *TaskUsecase) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	task, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if task == nil || task.IsDeleted() {
		return nil, domain.ErrNotFound
	}
	return task, nil
}

func (u *TaskUsecase) Update(ctx context.Context, id int64, in UpdateTaskInput) (*domain.Task, error) {
	task, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if task == nil || task.IsDeleted() {
		return nil, domain.ErrNotFound
	}
	if strings.TrimSpace(in.Title) == "" {
		return nil, domain.ErrValidation
	}
	status, err := u.validateStatus(in.Status)
	if err != nil {
		return nil, err
	}
	exists, err := u.repo.ExistsByTitle(ctx, in.Title, id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrDuplicateTitle
	}
	task.Title = in.Title
	task.Description = in.Description
	task.Status = status
	task.Assignee = in.Assignee
	task.UpdatedAt = time.Now()
	if err := u.repo.Update(ctx, task); err != nil {
		return nil, err
	}
	u.invalidateCache(ctx)
	return task, nil
}

func (u *TaskUsecase) SoftDelete(ctx context.Context, id int64) error {
	task, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if task == nil || task.IsDeleted() {
		return domain.ErrNotFound
	}
	if err := u.repo.SoftDelete(ctx, id); err != nil {
		return err
	}
	u.invalidateCache(ctx)
	return nil
}

func (u *TaskUsecase) List(ctx context.Context, filter repository.TaskFilter) ([]domain.Task, int, error) {
	// normalize
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}
	// cache key includes query params
	key := cacheKey(filter)
	if u.cache != nil {
		if b, err := u.cache.Get(ctx, key); err == nil && b != nil {
			// cached; decode
			cached, err := decodeCached(b)
			if err == nil {
				return cached.Tasks, cached.Total, nil
			}
		}
	}
	tasks, total, err := u.repo.List(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	if u.cache != nil {
		u.cache.Set(ctx, key, encodeCached(tasks, total), 60)
	}
	return tasks, total, nil
}

func (u *TaskUsecase) invalidateCache(ctx context.Context) {
	if u.cache != nil {
		u.cache.DeletePrefix(ctx, "tasks:list:")
	}
}

// --- cache helpers ---
type cachedResult struct {
	Tasks []domain.Task
	Total int
}

func cacheKey(f repository.TaskFilter) string {
	return fmt.Sprintf("tasks:list:status=%s&keyword=%s&assignee=%s&page=%d&limit=%d&sort=%s",
		f.Status, f.Keyword, f.Assignee, f.Page, f.Limit, f.Sort)
}

// We store JSON; implement encode/decode via encoding/json.
// (defined in cache_codec.go)
var _ = sort.Strings
var _ = strings.TrimSpace
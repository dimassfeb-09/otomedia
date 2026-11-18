package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"taskmanager/internal/domain"
	"taskmanager/internal/repository"
)

type TaskUsecase struct {
	taskRepository  repository.TaskRepository
	cacheRepository repository.CacheRepository
}

func NewTaskUsecase(taskRepository repository.TaskRepository, cacheRepository repository.CacheRepository) *TaskUsecase {
	return &TaskUsecase{taskRepository: taskRepository, cacheRepository: cacheRepository}
}

type CreateTaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Assignee    string `json:"assignee"`
}

type UpdateTaskInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Assignee    string `json:"assignee"`
}

func (taskUsecase *TaskUsecase) validateStatus(statusValue string) (domain.TaskStatus, error) {
	status := domain.TaskStatus(statusValue)

	if statusValue == "" {
		status = domain.StatusPending
	}

	if !status.IsValid() {
		return "", domain.ErrInvalidStatus
	}

	return status, nil
}

func (taskUsecase *TaskUsecase) Create(ctx context.Context, input CreateTaskInput) (*domain.Task, error) {
	if strings.TrimSpace(input.Title) == "" {
		return nil, domain.ErrValidation
	}

	status, err := taskUsecase.validateStatus(input.Status)
	if err != nil {
		return nil, err
	}

	exists, err := taskUsecase.taskRepository.ExistsByTitle(ctx, input.Title, 0)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, domain.ErrDuplicateTitle
	}

	now := time.Now()

	task := &domain.Task{
		Title:       input.Title,
		Description: input.Description,
		Status:      status,
		Assignee:    input.Assignee,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := taskUsecase.taskRepository.Create(ctx, task); err != nil {
		return nil, err
	}

	taskUsecase.invalidateCache(ctx)

	return task, nil
}

func (taskUsecase *TaskUsecase) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	task, err := taskUsecase.taskRepository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if task == nil || task.IsDeleted() {
		return nil, domain.ErrNotFound
	}

	return task, nil
}

func (taskUsecase *TaskUsecase) Update(ctx context.Context, id int64, input UpdateTaskInput) (*domain.Task, error) {
	task, err := taskUsecase.taskRepository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if task == nil || task.IsDeleted() {
		return nil, domain.ErrNotFound
	}

	if strings.TrimSpace(input.Title) == "" {
		return nil, domain.ErrValidation
	}

	status, err := taskUsecase.validateStatus(input.Status)
	if err != nil {
		return nil, err
	}

	exists, err := taskUsecase.taskRepository.ExistsByTitle(ctx, input.Title, id)
	if err != nil {
		return nil, err
	}

	if exists {
		return nil, domain.ErrDuplicateTitle
	}

	task.Title = input.Title
	task.Description = input.Description
	task.Status = status
	task.Assignee = input.Assignee
	task.UpdatedAt = time.Now()

	if err := taskUsecase.taskRepository.Update(ctx, task); err != nil {
		return nil, err
	}

	taskUsecase.invalidateCache(ctx)

	return task, nil
}

func (taskUsecase *TaskUsecase) SoftDelete(ctx context.Context, id int64) error {
	task, err := taskUsecase.taskRepository.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if task == nil || task.IsDeleted() {
		return domain.ErrNotFound
	}

	if err := taskUsecase.taskRepository.SoftDelete(ctx, id); err != nil {
		return err
	}

	taskUsecase.invalidateCache(ctx)

	return nil
}

func (taskUsecase *TaskUsecase) List(ctx context.Context, filter repository.TaskFilter) ([]domain.Task, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}

	if filter.Limit < 1 {
		filter.Limit = 10
	}

	if filter.Limit > 100 {
		filter.Limit = 100
	}

	key := cacheKey(filter)

	if taskUsecase.cacheRepository != nil {
		if filter.NoCache {
			_ = taskUsecase.cacheRepository.Delete(ctx, key)
		} else if cachedBytes, err := taskUsecase.cacheRepository.Get(ctx, key); err == nil && cachedBytes != nil {
			cached, err := decodeCached(cachedBytes)
			if err == nil {
				return cached.Tasks, cached.Total, nil
			}
		}
	}

	tasks, total, err := taskUsecase.taskRepository.List(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	if taskUsecase.cacheRepository != nil {
		taskUsecase.cacheRepository.Set(ctx, key, encodeCached(tasks, total), 60)
	}

	return tasks, total, nil
}

func (taskUsecase *TaskUsecase) invalidateCache(ctx context.Context) {
	if taskUsecase.cacheRepository != nil {
		taskUsecase.cacheRepository.DeletePrefix(ctx, "tasks:list:")
	}
}

func cacheKey(filter repository.TaskFilter) string {
	return fmt.Sprintf("tasks:list:status=%s&keyword=%s&assignee=%s&page=%d&limit=%d&sort=%s",
		filter.Status, filter.Keyword, filter.Assignee, filter.Page, filter.Limit, filter.Sort)
}

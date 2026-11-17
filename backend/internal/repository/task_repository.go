package repository

import (
	"context"

	"taskmanager/internal/domain"
)

// TaskFilter holds query parameters for listing tasks.
type TaskFilter struct {
	Status   string
	Keyword  string
	Assignee string
	Page     int
	Limit    int
	Sort     string // e.g. "created_at:desc"
}

// TaskRepository defines persistence operations for tasks.
type TaskRepository interface {
	Create(ctx context.Context, task *domain.Task) error
	GetByID(ctx context.Context, id int64) (*domain.Task, error)
	Update(ctx context.Context, task *domain.Task) error
	SoftDelete(ctx context.Context, id int64) error
	List(ctx context.Context, filter TaskFilter) ([]domain.Task, int, error)
	ExistsByTitle(ctx context.Context, title string, excludeID int64) (bool, error)
}

// CacheRepository defines cache operations.
type CacheRepository interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, value []byte, ttlSeconds int) error
	Delete(ctx context.Context, key string) error
	DeletePrefix(ctx context.Context, prefix string) error
}
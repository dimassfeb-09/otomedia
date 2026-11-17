package domain

import (
	"errors"
	"time"
)

// TaskStatus represents allowed task statuses.
type TaskStatus string

const (
	StatusPending    TaskStatus = "pending"
	StatusInProgress TaskStatus = "in_progress"
	StatusDone       TaskStatus = "done"
)

// IsValid checks whether the status is one of the allowed values.
func (s TaskStatus) IsValid() bool {
	switch s {
	case StatusPending, StatusInProgress, StatusDone:
		return true
	}
	return false
}

// Task is the core domain entity.
type Task struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      TaskStatus `json:"status"`
	Assignee    string     `json:"assignee"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

// IsDeleted reports whether the task has been soft-deleted.
func (t *Task) IsDeleted() bool {
	return t.DeletedAt != nil
}

// Domain errors.
var (
	ErrNotFound          = errors.New("task not found")
	ErrDuplicateTitle    = errors.New("duplicate task title")
	ErrInvalidStatus     = errors.New("invalid task status")
	ErrValidation        = errors.New("validation error")
	ErrInternal          = errors.New("internal error")
)
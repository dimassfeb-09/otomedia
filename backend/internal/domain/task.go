package domain

import (
	"errors"
	"time"
)

type TaskStatus string

const (
	StatusPending    TaskStatus = "pending"
	StatusInProgress TaskStatus = "in_progress"
	StatusDone       TaskStatus = "done"
)

func (status TaskStatus) IsValid() bool {
	switch status {
	case StatusPending, StatusInProgress, StatusDone:
		return true
	}

	return false
}

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

func (task *Task) IsDeleted() bool {
	return task.DeletedAt != nil
}

var (
	ErrNotFound       = errors.New("task not found")
	ErrDuplicateTitle = errors.New("duplicate task title")
	ErrInvalidStatus  = errors.New("invalid task status")
	ErrValidation     = errors.New("validation error")
	ErrInternal       = errors.New("internal error")
)

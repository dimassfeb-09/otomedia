package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"taskmanager/internal/domain"
)

// MySQLTaskRepository implements TaskRepository using MySQL.
type MySQLTaskRepository struct {
	db *sql.DB
}

func NewMySQLTaskRepository(db *sql.DB) *MySQLTaskRepository {
	return &MySQLTaskRepository{db: db}
}

func (r *MySQLTaskRepository) Create(ctx context.Context, task *domain.Task) error {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO tasks (title, description, status, assignee, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
		task.Title, task.Description, string(task.Status), task.Assignee, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		if isDuplicate(err) {
			return domain.ErrDuplicateTitle
		}
		return err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	task.ID = id
	return nil
}

func (r *MySQLTaskRepository) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	row := r.db.QueryRowContext(ctx,
		`SELECT id, title, description, status, assignee, created_at, updated_at, deleted_at FROM tasks WHERE id = ?`, id)
	return scanTask(row)
}

func (r *MySQLTaskRepository) Update(ctx context.Context, task *domain.Task) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE tasks SET title=?, description=?, status=?, assignee=?, updated_at=? WHERE id=? AND deleted_at IS NULL`,
		task.Title, task.Description, string(task.Status), task.Assignee, task.UpdatedAt, task.ID)
	if err != nil {
		if isDuplicate(err) {
			return domain.ErrDuplicateTitle
		}
		return err
	}
	return nil
}

func (r *MySQLTaskRepository) SoftDelete(ctx context.Context, id int64) error {
	now := time.Now()
	_, err := r.db.ExecContext(ctx,
		`UPDATE tasks SET deleted_at=?, updated_at=? WHERE id=? AND deleted_at IS NULL`, now, now, id)
	return err
}

func (r *MySQLTaskRepository) List(ctx context.Context, filter TaskFilter) ([]domain.Task, int, error) {
	where := []string{"deleted_at IS NULL"}
	args := []interface{}{}
	if filter.Status != "" {
		where = append(where, "status = ?")
		args = append(args, filter.Status)
	}
	if filter.Assignee != "" {
		where = append(where, "assignee = ?")
		args = append(args, filter.Assignee)
	}
	if filter.Keyword != "" {
		where = append(where, "(title LIKE ? OR description LIKE ?)")
		kw := "%" + filter.Keyword + "%"
		args = append(args, kw, kw)
	}
	whereClause := "WHERE " + strings.Join(where, " AND ")

	// count
	var total int
	countSQL := "SELECT COUNT(*) FROM tasks " + whereClause
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// sort
	order := "created_at DESC"
	if filter.Sort != "" {
		parts := strings.Split(filter.Sort, ":")
		col := parts[0]
		allowed := map[string]bool{"created_at": true, "updated_at": true, "title": true, "status": true}
		if allowed[col] {
			dir := "ASC"
			if len(parts) > 1 && strings.EqualFold(parts[1], "desc") {
				dir = "DESC"
			}
			order = col + " " + dir
		}
	}

	offset := (filter.Page - 1) * filter.Limit
	query := fmt.Sprintf("SELECT id, title, description, status, assignee, created_at, updated_at, deleted_at FROM tasks %s ORDER BY %s LIMIT ? OFFSET ?", whereClause, order)
	args = append(args, filter.Limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tasks []domain.Task
	for rows.Next() {
		t, err := scanTaskRows(rows)
		if err != nil {
			return nil, 0, err
		}
		tasks = append(tasks, *t)
	}
	if tasks == nil {
		tasks = []domain.Task{}
	}
	return tasks, total, rows.Err()
}

func (r *MySQLTaskRepository) ExistsByTitle(ctx context.Context, title string, excludeID int64) (bool, error) {
	var count int
	q := "SELECT COUNT(*) FROM tasks WHERE title = ? AND deleted_at IS NULL"
	args := []interface{}{title}
	if excludeID > 0 {
		q += " AND id <> ?"
		args = append(args, excludeID)
	}
	err := r.db.QueryRowContext(ctx, q, args...).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanTask(s scanner) (*domain.Task, error) {
	var t domain.Task
	var status string
	var deletedAt sql.NullTime
	err := s.Scan(&t.ID, &t.Title, &t.Description, &status, &t.Assignee, &t.CreatedAt, &t.UpdatedAt, &deletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	t.Status = domain.TaskStatus(status)
	if deletedAt.Valid {
		tm := deletedAt.Time
		t.DeletedAt = &tm
	}
	return &t, nil
}

func scanTaskRows(rows *sql.Rows) (*domain.Task, error) {
	return scanTask(rows)
}

func isDuplicate(err error) bool {
	// MySQL duplicate entry error code 1062
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "Duplicate entry") || strings.Contains(msg, "1062")
}
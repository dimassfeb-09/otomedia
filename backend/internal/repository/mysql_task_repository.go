package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"taskmanager/internal/domain"
)

type MySQLTaskRepository struct {
	database *sql.DB
}

func NewMySQLTaskRepository(database *sql.DB) *MySQLTaskRepository {
	return &MySQLTaskRepository{database: database}
}

func (taskRepository *MySQLTaskRepository) Create(ctx context.Context, task *domain.Task) error {
	result, err := taskRepository.database.ExecContext(ctx,
		`INSERT INTO tasks (title, description, status, assignee, created_at, updated_at) VALUES (?,?,?,?,?,?)`,
		task.Title, task.Description, string(task.Status), task.Assignee, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		if isDuplicate(err) {
			return domain.ErrDuplicateTitle
		}

		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	task.ID = id

	return nil
}

func (taskRepository *MySQLTaskRepository) GetByID(ctx context.Context, id int64) (*domain.Task, error) {
	resultRow := taskRepository.database.QueryRowContext(ctx,
		`SELECT id, title, description, status, assignee, created_at, updated_at, deleted_at FROM tasks WHERE id = ?`, id)

	return scanTask(resultRow)
}

func (taskRepository *MySQLTaskRepository) Update(ctx context.Context, task *domain.Task) error {
	_, err := taskRepository.database.ExecContext(ctx,
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

func (taskRepository *MySQLTaskRepository) SoftDelete(ctx context.Context, id int64) error {
	now := time.Now()

	_, err := taskRepository.database.ExecContext(ctx,
		`UPDATE tasks SET deleted_at=?, updated_at=? WHERE id=? AND deleted_at IS NULL`, now, now, id)

	return err
}

func (taskRepository *MySQLTaskRepository) List(ctx context.Context, filter TaskFilter) ([]domain.Task, int, error) {
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
		keyword := "%" + filter.Keyword + "%"
		args = append(args, keyword, keyword)
	}

	whereClause := "WHERE " + strings.Join(where, " AND ")

	var total int

	countSQL := "SELECT COUNT(*) FROM tasks " + whereClause
	if err := taskRepository.database.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	orderClause := "created_at DESC, id DESC"

	if filter.Sort != "" {
		sortParts := strings.Split(filter.Sort, ":")
		column := sortParts[0]

		allowed := map[string]bool{"created_at": true, "updated_at": true, "title": true, "status": true}

		if allowed[column] {
			direction := "ASC"

			if len(sortParts) > 1 && strings.EqualFold(sortParts[1], "desc") {
				direction = "DESC"
			}

			orderClause = column + " " + direction + ", id DESC"
		}
	}

	offset := (filter.Page - 1) * filter.Limit

	query := fmt.Sprintf("SELECT id, title, description, status, assignee, created_at, updated_at, deleted_at FROM tasks %s ORDER BY %s LIMIT ? OFFSET ?", whereClause, orderClause)
	args = append(args, filter.Limit, offset)

	rows, err := taskRepository.database.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tasks []domain.Task

	for rows.Next() {
		task, err := scanTaskRows(rows)
		if err != nil {
			return nil, 0, err
		}

		tasks = append(tasks, *task)
	}

	if tasks == nil {
		tasks = []domain.Task{}
	}

	return tasks, total, rows.Err()
}

func (taskRepository *MySQLTaskRepository) ExistsByTitle(ctx context.Context, title string, excludeID int64) (bool, error) {
	var count int

	query := "SELECT COUNT(*) FROM tasks WHERE title = ? AND deleted_at IS NULL"
	args := []interface{}{title}

	if excludeID > 0 {
		query += " AND id <> ?"
		args = append(args, excludeID)
	}

	err := taskRepository.database.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

type scanner interface {
	Scan(dest ...interface{}) error
}

func scanTask(scanTarget scanner) (*domain.Task, error) {
	var task domain.Task
	var status string
	var deletedAt sql.NullTime

	err := scanTarget.Scan(&task.ID, &task.Title, &task.Description, &status, &task.Assignee, &task.CreatedAt, &task.UpdatedAt, &deletedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	task.Status = domain.TaskStatus(status)

	if deletedAt.Valid {
		deletedTime := deletedAt.Time
		task.DeletedAt = &deletedTime
	}

	return &task, nil
}

func scanTaskRows(rows *sql.Rows) (*domain.Task, error) {
	return scanTask(rows)
}

func isDuplicate(err error) bool {
	if err == nil {
		return false
	}

	message := err.Error()

	return strings.Contains(message, "Duplicate entry") || strings.Contains(message, "1062")
}

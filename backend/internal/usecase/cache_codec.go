package usecase

import (
	"encoding/json"

	"taskmanager/internal/domain"
	"taskmanager/internal/repository"
)

type cachedPayload struct {
	Tasks []domain.Task `json:"tasks"`
	Total int           `json:"total"`
}

func encodeCached(tasks []domain.Task, total int) []byte {
	b, _ := json.Marshal(cachedPayload{Tasks: tasks, Total: total})
	return b
}

func decodeCached(b []byte) (cachedPayload, error) {
	var p cachedPayload
	err := json.Unmarshal(b, &p)
	return p, err
}
// ensure repository import used
var _ repository.TaskFilter
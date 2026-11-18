package usecase

import (
	"encoding/json"

	"taskmanager/internal/domain"
)

type cachedPayload struct {
	Tasks []domain.Task `json:"tasks"`
	Total int           `json:"total"`
}

func encodeCached(tasks []domain.Task, total int) []byte {
	encodedBytes, _ := json.Marshal(cachedPayload{Tasks: tasks, Total: total})

	return encodedBytes
}

func decodeCached(encodedBytes []byte) (cachedPayload, error) {
	var payload cachedPayload

	err := json.Unmarshal(encodedBytes, &payload)

	return payload, err
}

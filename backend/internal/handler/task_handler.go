package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"taskmanager/internal/domain"
	"taskmanager/internal/dto"
	"taskmanager/internal/repository"
	"taskmanager/internal/usecase"
)

// TaskHandler handles HTTP requests for tasks.
type TaskHandler struct {
	uc *usecase.TaskUsecase
}

func NewTaskHandler(uc *usecase.TaskUsecase) *TaskHandler {
	return &TaskHandler{uc: uc}
}

func (h *TaskHandler) writeError(c *gin.Context, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	msg := err.Error()
	switch err {
	case domain.ErrNotFound:
		status = http.StatusNotFound
		code = "NOT_FOUND"
	case domain.ErrDuplicateTitle:
		status = http.StatusConflict
		code = "DUPLICATE_TITLE"
	case domain.ErrInvalidStatus:
		status = http.StatusBadRequest
		code = "INVALID_STATUS"
	case domain.ErrValidation:
		status = http.StatusBadRequest
		code = "VALIDATION_ERROR"
	}
	c.JSON(status, dto.ErrorResponse{Error: dto.ErrorDetail{Code: code, Message: msg}})
}

func (h *TaskHandler) Create(c *gin.Context) {
	var req dto.CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()}})
		return
	}
	task, err := h.uc.Create(c.Request.Context(), usecase.CreateTaskInput{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Assignee:    req.Assignee,
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, dto.FromDomain(*task))
}

func (h *TaskHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}
	task, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.FromDomain(*task))
}

func (h *TaskHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}
	var req dto.UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()}})
		return
	}
	task, err := h.uc.Update(c.Request.Context(), id, usecase.UpdateTaskInput{
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Assignee:    req.Assignee,
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, dto.FromDomain(*task))
}

func (h *TaskHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}
	if err := h.uc.SoftDelete(c.Request.Context(), id); err != nil {
		h.writeError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *TaskHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	filter := repository.TaskFilter{
		Status:   c.Query("status"),
		Keyword:  c.Query("keyword"),
		Assignee: c.Query("assignee"),
		Page:     page,
		Limit:    limit,
		Sort:     c.Query("sort"),
	}
	tasks, total, err := h.uc.List(c.Request.Context(), filter)
	if err != nil {
		h.writeError(c, err)
		return
	}
	resp := make([]dto.TaskResponse, 0, len(tasks))
	for _, t := range tasks {
		resp = append(resp, dto.FromDomain(t))
	}
	c.JSON(http.StatusOK, gin.H{
		"data":  resp,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}
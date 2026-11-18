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

type TaskHandler struct {
	taskUsecase *usecase.TaskUsecase
}

func NewTaskHandler(taskUsecase *usecase.TaskUsecase) *TaskHandler {
	return &TaskHandler{taskUsecase: taskUsecase}
}

func (taskHandler *TaskHandler) writeError(ctx *gin.Context, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	message := err.Error()

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

	ctx.JSON(status, dto.ErrorResponse{Error: dto.ErrorDetail{Code: code, Message: message}})
}

func (taskHandler *TaskHandler) Create(ctx *gin.Context) {
	var request dto.CreateTaskRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()}})
		return
	}

	task, err := taskHandler.taskUsecase.Create(ctx.Request.Context(), usecase.CreateTaskInput{
		Title:       request.Title,
		Description: request.Description,
		Status:      request.Status,
		Assignee:    request.Assignee,
	})
	if err != nil {
		taskHandler.writeError(ctx, err)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": dto.FromDomain(*task)})
}

func (taskHandler *TaskHandler) GetByID(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}

	task, err := taskHandler.taskUsecase.GetByID(ctx.Request.Context(), id)
	if err != nil {
		taskHandler.writeError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": dto.FromDomain(*task)})
}

func (taskHandler *TaskHandler) Update(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}

	var request dto.UpdateTaskRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "VALIDATION_ERROR", Message: err.Error()}})
		return
	}

	task, err := taskHandler.taskUsecase.Update(ctx.Request.Context(), id, usecase.UpdateTaskInput{
		Title:       request.Title,
		Description: request.Description,
		Status:      request.Status,
		Assignee:    request.Assignee,
	})
	if err != nil {
		taskHandler.writeError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": dto.FromDomain(*task)})
}

func (taskHandler *TaskHandler) Delete(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: dto.ErrorDetail{Code: "INVALID_ID", Message: "invalid id"}})
		return
	}

	if err := taskHandler.taskUsecase.SoftDelete(ctx.Request.Context(), id); err != nil {
		taskHandler.writeError(ctx, err)
		return
	}

	ctx.Status(http.StatusNoContent)
}

func (taskHandler *TaskHandler) List(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	filter := repository.TaskFilter{
		Status:   ctx.Query("status"),
		Keyword:  ctx.Query("keyword"),
		Assignee: ctx.Query("assignee"),
		Page:     page,
		Limit:    limit,
		Sort:     ctx.Query("sort"),
		NoCache:  ctx.Query("refresh") == "1",
	}

	tasks, total, err := taskHandler.taskUsecase.List(ctx.Request.Context(), filter)
	if err != nil {
		taskHandler.writeError(ctx, err)
		return
	}

	response := make([]dto.TaskResponse, 0, len(tasks))
	for _, task := range tasks {
		response = append(response, dto.FromDomain(task))
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": response,
		"meta": gin.H{
			"total": total,
			"page":  filter.Page,
			"limit": filter.Limit,
		},
	})
}

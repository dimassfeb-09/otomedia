package main

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"taskmanager/internal/config"
	"taskmanager/internal/handler"
	"taskmanager/internal/repository"
	"taskmanager/internal/usecase"
)

func main() {
	cfg := config.Load()

	db, err := sql.Open("mysql", cfg.MySQLDSN)
	if err != nil {
		log.Fatal(err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		log.Printf("mysql ping failed: %v", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr})

	taskRepo := repository.NewMySQLTaskRepository(db)
	cacheRepo := repository.NewRedisCache(rdb)

	uc := usecase.NewTaskUsecase(taskRepo, cacheRepo)
	h := handler.NewTaskHandler(uc)

	r := gin.Default()
	api := r.Group("/api")
	{
		tasks := api.Group("/tasks")
		tasks.GET("", h.List)
		tasks.GET("/:id", h.GetByID)
		tasks.POST("", h.Create)
		tasks.PUT("/:id", h.Update)
		tasks.DELETE("/:id", h.Delete)
	}

	log.Printf("server listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
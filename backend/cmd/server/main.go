package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"

	"taskmanager/internal/config"
	"taskmanager/internal/handler"
	"taskmanager/internal/repository"
	"taskmanager/internal/usecase"
)

const scalarUI = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Task Management API</title>
</head>
<body>
<script id="api-reference" data-url="/docs/openapi.yaml"></script>
<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`

func main() {
	appConfig := config.Load()

	database, err := sql.Open("mysql", appConfig.MySQLDSN)
	if err != nil {
		log.Fatal(err)
	}

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(5)
	database.SetConnMaxLifetime(5 * time.Minute)

	if err := database.Ping(); err != nil {
		log.Printf("mysql ping failed: %v", err)
	}

	redisClient := redis.NewClient(&redis.Options{Addr: appConfig.RedisAddr})

	taskRepository := repository.NewMySQLTaskRepository(database)
	cacheRepository := repository.NewRedisCache(redisClient)

	taskUsecase := usecase.NewTaskUsecase(taskRepository, cacheRepository)
	taskHandler := handler.NewTaskHandler(taskUsecase)

	router := gin.Default()
	router.Use(cors.Default())

	api := router.Group("/api")
	{
		tasks := api.Group("/tasks")
		tasks.GET("", taskHandler.List)
		tasks.GET("/:id", taskHandler.GetByID)
		tasks.POST("", taskHandler.Create)
		tasks.PUT("/:id", taskHandler.Update)
		tasks.DELETE("/:id", taskHandler.Delete)
	}

	router.GET("/docs", func(ctx *gin.Context) {
		ctx.Data(http.StatusOK, "text/html; charset=utf-8", []byte(scalarUI))
	})

	router.GET("/docs/openapi.yaml", func(ctx *gin.Context) {
		ctx.File("./docs/openapi.yaml")
	})

	log.Printf("server listening on :%s", appConfig.Port)

	if err := router.Run(":" + appConfig.Port); err != nil {
		log.Fatal(err)
	}
}

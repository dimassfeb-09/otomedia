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

const swaggerUI = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Task Management API</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>
window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/swagger/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true
  });
};
</script>
</body>
</html>`

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
	r.Use(cors.Default())
	api := r.Group("/api")
	{
		tasks := api.Group("/tasks")
		tasks.GET("", h.List)
		tasks.GET("/:id", h.GetByID)
		tasks.POST("", h.Create)
		tasks.PUT("/:id", h.Update)
		tasks.DELETE("/:id", h.Delete)
	}

	r.GET("/swagger", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(swaggerUI))
	})
	r.GET("/swagger/openapi.yaml", func(c *gin.Context) {
		c.File("./docs/openapi.yaml")
	})

	log.Printf("server listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}

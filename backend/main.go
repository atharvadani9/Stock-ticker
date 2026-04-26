package main

import (
	"context"

	"github.com/atharvadani9/stock-ticker/backend/handlers"
	"github.com/atharvadani9/stock-ticker/backend/queue"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	ctx := context.Background()
	go queue.Worker(ctx)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "PUT", "POST"},
		AllowHeaders: []string{"Content-Type"},
	}))

	r.GET("/table", handlers.GetTable)
	r.PUT("/table", handlers.PutTable)
	r.POST("/llm/async", handlers.SubmitLLM)
	r.GET("/llm/async/poll/:task_id", handlers.PollLLM)

	r.Run(":8080")
}

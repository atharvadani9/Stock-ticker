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
		AllowOriginFunc: func(origin string) bool {
			return origin == "http://localhost:5173" ||
				len(origin) > 14 && origin[len(origin)-14:] == ".up.railway.app" ||
				len(origin) > 11 && origin[len(origin)-11:] == ".vercel.app"
		},
		AllowMethods: []string{"GET", "PUT", "POST"},
		AllowHeaders: []string{"Content-Type"},
	}))

	r.GET("/table", handlers.GetTable)
	r.PUT("/table", handlers.PutTable)
	r.POST("/llm/async", handlers.SubmitLLM)
	r.GET("/llm/async/poll/:task_id", handlers.PollLLM)

	r.Run(":8080")
}

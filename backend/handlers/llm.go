package handlers

import (
	"net/http"

	"github.com/atharvadani9/stock-ticker/backend/models"
	"github.com/atharvadani9/stock-ticker/backend/queue"
	"github.com/gin-gonic/gin"
)

func SubmitLLM(c *gin.Context) {
	var req models.LLMRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	taskID := queue.Enqueue(req.Prompt)
	c.JSON(http.StatusOK, gin.H{"task_id": taskID})
}

func PollLLM(c *gin.Context) {
	taskID := c.Param("task_id")
	status, ok := queue.GetTask(taskID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	c.JSON(http.StatusOK, status)
}

package queue

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/atharvadani9/stock-ticker/backend/models"
	"github.com/google/uuid"
)

type task struct {
	id     string
	prompt string
}

var (
	taskCh  = make(chan task, 100)
	results sync.Map
)

func Enqueue(prompt string) string {
	id := uuid.New().String()
	results.Store(id, models.TaskStatus{TaskID: id, Status: "pending"})
	taskCh <- task{id: id, prompt: prompt}
	return id
}

func GetTask(id string) (models.TaskStatus, bool) {
	v, ok := results.Load(id)
	if !ok {
		return models.TaskStatus{}, false
	}
	return v.(models.TaskStatus), true
}

func Worker(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case t := <-taskCh:
			time.Sleep(2 * time.Second)
			result := fmt.Sprintf("Mock response for prompt: \"%s\"", truncate(t.prompt, 60))
			results.Store(t.id, models.TaskStatus{TaskID: t.id, Status: "done", Result: &result})
		}
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

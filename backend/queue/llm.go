package queue

import (
	"context"
	"fmt"
	"math/rand"
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
			go func(t task) {
				time.Sleep(2 * time.Second)
				if rand.Float32() < 0.2 {
					errMsg := "mock error: simulated LLM failure"
					results.Store(t.id, models.TaskStatus{TaskID: t.id, Status: "error", Result: &errMsg})
					return
				}
				result := fmt.Sprintf("Mock response for prompt: \"%s\"", truncate(t.prompt, 60))
				results.Store(t.id, models.TaskStatus{TaskID: t.id, Status: "done", Result: &result})
			}(t)
		}
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}

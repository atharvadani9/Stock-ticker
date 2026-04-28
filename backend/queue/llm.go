package queue

import (
	"context"
	"log"
	"sync"

	"github.com/anthropics/anthropic-sdk-go"
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
	client := anthropic.NewClient()
	for {
		select {
		case <-ctx.Done():
			return
		case t := <-taskCh:
			msg, err := client.Messages.New(ctx, anthropic.MessageNewParams{
				Model:     anthropic.ModelClaudeHaiku4_5,
				MaxTokens: 256,
				System: []anthropic.TextBlockParam{
					{Text: "You are a financial data assistant. Answer questions about stocks and companies concisely — 1-2 sentences max, no markdown, no bullet points, no caveats. Give a direct factual answer only."},
				},
				Messages: []anthropic.MessageParam{anthropic.NewUserMessage(anthropic.NewTextBlock(t.prompt))},
			})
			if err != nil {
				errMsg := err.Error()
				results.Store(t.id, models.TaskStatus{TaskID: t.id, Status: "error", Result: &errMsg})
				continue
			}
			log.Printf("task %s: input=%d output=%d tokens", t.id[:8], msg.Usage.InputTokens, msg.Usage.OutputTokens)
			result := msg.Content[0].Text
			results.Store(t.id, models.TaskStatus{TaskID: t.id, Status: "done", Result: &result})
		}
	}
}

package models

type Column struct {
	ID     string `json:"id"`
	Prompt string `json:"prompt"`
}

type Row struct {
	ID     string `json:"id"`
	Ticker string `json:"ticker"`
}

type CellValue struct {
	Value  *string `json:"value"`
	Status string  `json:"status"` // idle | loading | done | error
}

type TableState struct {
	Rows    []Row                `json:"rows"`
	Columns []Column             `json:"columns"`
	Cells   map[string]CellValue `json:"cells"` // key: "rowId:colId"
}

type LLMRequest struct {
	Prompt string `json:"prompt"`
}

type TaskStatus struct {
	TaskID string  `json:"task_id"`
	Status string  `json:"status"` // pending | done | error
	Result *string `json:"result,omitempty"`
}

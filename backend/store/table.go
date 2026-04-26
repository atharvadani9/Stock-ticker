package store

import (
	"sync"

	"github.com/atharvadani9/stock-ticker/backend/models"
)

var (
	mu    sync.RWMutex
	state = models.TableState{
		Rows: []models.Row{
			{ID: "row_1", Ticker: "TSLA"},
			{ID: "row_2", Ticker: "NVDA"},
			{ID: "row_3", Ticker: "AAPL"},
		},
		Columns: []models.Column{
			{ID: "col_1", Prompt: ""},
			{ID: "col_2", Prompt: ""},
		},
		Cells: map[string]models.CellValue{},
	}
)

func GetTable() models.TableState {
	mu.RLock()
	defer mu.RUnlock()

	copy := models.TableState{
		Rows:    make([]models.Row, len(state.Rows)),
		Columns: make([]models.Column, len(state.Columns)),
		Cells:   make(map[string]models.CellValue, len(state.Cells)),
	}
	for i, r := range state.Rows {
		copy.Rows[i] = r
	}
	for i, c := range state.Columns {
		copy.Columns[i] = c
	}
	for k, v := range state.Cells {
		copy.Cells[k] = v
	}
	return copy
}

func PutTable(s models.TableState) models.TableState {
	mu.Lock()
	defer mu.Unlock()
	state = s
	return state
}

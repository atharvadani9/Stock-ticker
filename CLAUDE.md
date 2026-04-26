# Stock Ticker AI Table — Implementation Plan

## Context
Build a single-page web app where users create a table of stock tickers with AI-powered columns. Each column has a user-defined natural language prompt; clicking "Run" generates answers for every (ticker × prompt) cell using Claude via async LLM calls with polling.

---

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Go + Gin HTTP framework
- **LLM**: Anthropic Go SDK (`github.com/anthropics/anthropic-sdk-go`), `claude-haiku-4-5-20251001`
- **State**: React `useState`/`useEffect`, no external state library

---

## Project Structure

```
Stock-ticker/
├── backend/
│   ├── go.mod
│   ├── go.sum
│   ├── main.go               # Gin router setup, CORS, server start
│   ├── models/
│   │   └── models.go         # Go structs for Table, Row, Column, Cell, Task
│   ├── store/
│   │   └── table.go          # In-memory table store with sync.RWMutex
│   ├── queue/
│   │   └── llm.go            # Buffered channel queue + goroutine worker
│   └── handlers/
│       ├── table.go          # GET/PUT /table
│       └── llm.go            # POST /llm/async, GET /llm/async/poll/:task_id
└── frontend/
    ├── index.html
    ├── vite.config.ts        # Proxy /table and /llm to :8080
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types.ts
        ├── api.ts
        ├── hooks/
        │   ├── useTable.ts   # Table state + CRUD sync
        │   └── usePolling.ts # runAllCells() fan-out + polling logic
        └── components/
            ├── StockTable.tsx
            ├── Toolbar.tsx
            ├── ColumnHeader.tsx
            ├── TickerCell.tsx
            └── AiCell.tsx
```

---

## Data Models

### Go (models/models.go)
```go
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
```

### TypeScript (src/types.ts)
```typescript
export const TICKERS = ["TSLA","NVDA","AAPL","GOOGL","MSFT","AMZN","META","NFLX","AMD","INTC"] as const
export type Ticker = typeof TICKERS[number]
export type CellStatus = "idle" | "loading" | "done" | "error"
export interface Column { id: string; prompt: string }
export interface Row { id: string; ticker: Ticker }
export interface CellValue { value: string | null; status: CellStatus }
export interface TableState {
    rows: Row[]; columns: Column[]; cells: Record<string, CellValue>
}
export interface PollResponse { status: "pending"|"done"|"error"; result?: string }
```

---

## Backend Implementation

### queue/llm.go
- `taskCh chan task` buffered to 100 (task = {id, prompt})
- `results sync.Map` keyed by task UUID → `TaskStatus`
- `func Enqueue(prompt string) string` — generates UUID, stores `{status:"pending"}`, sends to channel, returns UUID
- `func GetTask(id string) (TaskStatus, bool)` — reads from sync.Map
- `func Worker(ctx context.Context)` — goroutine, reads from `taskCh`, calls Anthropic SDK:
  ```go
  client := anthropic.NewClient() // reads ANTHROPIC_API_KEY from env
  msg, err := client.Messages.New(ctx, anthropic.MessageNewParams{
      Model:     anthropic.ModelClaude_Haiku_4_5,
      MaxTokens: 256,
      Messages:  []anthropic.MessageParam{{Role: "user", Content: prompt}},
  })
  ```
  On success → stores `{status:"done", result: msg.Content[0].Text}`.
  On error → stores `{status:"error", result: err.Error()}`.

### store/table.go
- `sync.RWMutex` guards `state TableState`
- Seeds initial state with 3 rows (TSLA, NVDA, AAPL), 2 empty columns
- `GetTable() TableState` — RLock, return deep copy
- `PutTable(s TableState) TableState` — Lock, replace state, return copy

### handlers/table.go
```
GET  /table     → store.GetTable() → JSON
PUT  /table     → bind JSON → store.PutTable() → JSON
```

### handlers/llm.go
```
POST /llm/async               → bind {prompt} → queue.Enqueue(prompt) → {task_id}
GET  /llm/async/poll/:task_id → queue.GetTask(id) → TaskStatus | 404
```

### main.go
- `gin.New()` with CORS middleware (allow origin `http://localhost:5173`)
- Register routes
- `go queue.Worker(ctx)` — start background worker
- `r.Run(":8080")`

### go.mod dependencies
```
github.com/anthropics/anthropic-sdk-go
github.com/gin-gonic/gin
github.com/gin-contrib/cors
github.com/google/uuid
```

---

## Frontend Implementation

### vite.config.ts — Proxy
```typescript
server: { proxy: { '/table': 'http://localhost:8080', '/llm': 'http://localhost:8080' } }
```
Frontend uses relative paths only — no hardcoded ports.

### api.ts
Thin wrappers around `fetch`:
- `fetchTable()` → GET /table
- `saveTable(state)` → PUT /table
- `submitLLM(prompt)` → POST /llm/async → `{task_id}`
- `pollTask(id)` → GET /llm/async/poll/{id} → `PollResponse`

### hooks/useTable.ts
- Loads table from `GET /table` on mount
- Exposes: `addRow()`, `addColumn()`, `updateTicker(rowId, ticker)`, `updatePrompt(colId, prompt)`, `updateCell(rowId, colId, partial)`, `getCell(rowId, colId)`
- Structural changes (add row/col, ticker/prompt change) call `saveTable()` immediately
- Cell updates during run use `setTable` only (batch save after run completes)

### hooks/usePolling.ts — `runAllCells(table, updateCell)`
```
For each (row, col) where col.prompt is non-empty:
  1. updateCell(rowId, colId, {status:"loading"})
  2. POST /llm/async → task_id
  3. Poll GET /llm/async/poll/{task_id} every 1500ms
  4. On done/error → updateCell with result
All cells run concurrently via Promise.all
```

### Component Responsibilities

| Component | Renders |
|-----------|---------|
| `StockTable` | Calls `useTable`, manages `isRunning`, calls `runAllCells` on Run click, renders full table |
| `Toolbar` | Run button (disabled + "Running…" when `isRunning`), Add Row, Add Column |
| `ColumnHeader` | Text input (draft state) + Save button → `onSave(colId, draft)`. Save does NOT trigger LLM. |
| `TickerCell` | `<select>` with 10 ticker options → `onChange` calls `updateTicker` |
| `AiCell` | idle=gray, loading=pulse animation, done=text, error=red text |

---

## UX Flow

1. Page loads → fetches table (3 rows, 2 columns pre-seeded)
2. User changes ticker via dropdown → PUT /table
3. User types prompt in column header, clicks Save → PUT /table (no LLM)
4. User clicks **Run** → all (ticker × prompt) cells go to loading simultaneously
5. Backend worker processes queue tasks, Claude responds
6. Cells fill in as polling resolves (each cell independently updates)
7. After all settle → final PUT /table persists cell values

---

## Startup

```bash
# Terminal 1 — Backend
cd Stock-ticker/backend
export ANTHROPIC_API_KEY="your_key_here"
go run .          # serves on :8080

# Terminal 2 — Frontend
cd Stock-ticker/frontend
npm install
npm run dev       # serves on :5173, proxies to :8080
```

---

## Verification

1. `curl localhost:8080/table` → returns seeded table JSON
2. `curl -X POST localhost:8080/llm/async -H "Content-Type: application/json" -d '{"prompt":"What is TSLA?"}'` → `{"task_id":"..."}`
3. `curl localhost:8080/llm/async/poll/{task_id}` → poll until `status:"done"`
4. Open `http://localhost:5173` → table renders
5. Change prompt in column header, click Save → network tab shows PUT /table
6. Click Run → cells show spinner, then populate with Claude responses
7. Verify each cell independently resolves (no blocking)

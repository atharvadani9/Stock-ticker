# Stock Ticker AI Table

A single-page web app that lets users build a table of stock tickers with AI-powered columns. Each column has a user-defined natural language prompt; clicking **Run** generates answers for every (ticker × prompt) cell using Claude via async LLM calls with polling.

**Live demo:** https://stock-ticker-wine.vercel.app/

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI Components | Material UI (MUI) |
| Backend | Go + Gin HTTP framework |
| LLM Queue | Buffered channel + goroutine worker |
| LLM | Anthropic Claude (mock in dev) |
| State | React `useState`/`useEffect`, no external library |

---

## Getting Started

### Backend
```bash
cd backend
go run .    # serves on :8080, uses mock LLM (2s delay, canned responses)
```

To use the real Anthropic API instead of the mock, set the environment variable and swap the mock worker for the real SDK call in `backend/queue/llm.go`:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # serves on :5173, proxies /table and /llm to :8080
```

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/table` | Fetch current table state |
| `PUT` | `/table` | Replace full table state |
| `POST` | `/llm/async` | Enqueue LLM task → `{task_id}` |
| `GET` | `/llm/async/poll/:task_id` | Poll task status/result |

---

## Features

- **Ticker column** — dropdown per row with 10 fixed tickers (TSLA, NVDA, AAPL, GOOGL, MSFT, AMZN, META, NFLX, AMD, INTC)
- **AI columns** — each column has a user-defined prompt in the header; cells are populated on Run
- **Add/remove rows and columns** — inline buttons in the table
- **Async LLM execution** — clicking Run fans out all (ticker × prompt) cells concurrently via `Promise.all` on the frontend; each cell independently submits a task and polls for its result. On the backend, each task is processed in its own goroutine so LLM calls run in parallel — all cells complete in ~the same time regardless of table size
- **Per-cell loading state** — spinner while pending, result text when done, red text on error
- **Mock backend** — 2s simulated delay with canned responses; swap to real Claude by editing `queue/llm.go` only

---

## Edge Cases Handled

### No duplicate tickers
`addRow` picks the first ticker not already in the table. `updateTicker` silently blocks switching to a ticker used by another row. Prevents wasted duplicate LLM calls.

### Smart re-run
Clicking **Run** does not blindly re-run all cells. A cell is only re-run if:
- It has never been run (`status: "idle"`)
- Its row's ticker changed since the last run
- Its column's prompt changed since the last run
- The row or column is new (not present during the last run)

This avoids redundant API calls when adding a new row — only the new row's cells fire, not the entire table.

### Cell cleanup on delete
When a row or column is deleted, all associated cell values are removed from state and persisted to the backend. No stale data accumulates.

### Prompt saved on Run, not on type
Column prompts are kept in local React state as the user types. They are only persisted to the backend (`PUT /table`) when Run is clicked (along with cell results). This avoids flooding the backend with PUT requests on every keystroke.

### Queue back-pressure
The backend LLM queue channel is buffered to 100. Tasks that arrive while the worker is busy are queued and processed in order without dropping requests.

### Concurrent polling with exponential backoff
Each cell independently polls `/llm/async/poll/:task_id`. Poll intervals use exponential backoff — starting at 1s, doubling each miss, capping at 8s. This avoids hammering the backend during slow LLM calls while staying responsive for fast ones. Cells update as they resolve — fast tasks appear immediately without waiting for slow ones.

### Automatic retry on LLM error
If a task returns `"error"`, the cell silently re-submits a new LLM task and polls the fresh `task_id` — up to 3 retries. Only if all 4 attempts fail does the cell show an error. Each retry resets the backoff to 1s. This handles transient failures (rate limits, timeouts) that are common with real LLM APIs.

---

## Design Decisions

### Why a single PUT /table for state?
The table state (rows, columns, cells) is small and always replaced atomically. This keeps the backend stateless and simple — no partial-update endpoints to maintain, no merge conflicts.

### Why Go for the backend?
Goroutines make the async queue trivial — a buffered channel dispatches tasks to a coordinator goroutine, which spawns a new goroutine per task so all LLM calls run in parallel. No separate job queue system (Redis, Celery) needed.

### Why mock-first?
The LLM swap is a one-function change in `queue/llm.go`. Building mock-first let us validate the entire UI/polling flow without needing an API key, and keeps the demo cost-free.

### Why no external state library?
The state shape is simple: a flat `TableState` with rows, columns, and a `Record<string, CellValue>` for cells. `useState` + `useCallback` is sufficient; Redux or Zustand would add complexity without benefit here.

### Why async queue + polling instead of streaming?
Streaming requires a persistent connection per cell. With an N×M table that means N×M open connections simultaneously. A queue decouples submission from completion — each cell submits instantly and gets a `task_id`, then polls independently. This scales better and is simpler to reason about.

### Why a goroutine per task instead of a single worker?
A single worker processes tasks serially — 9 cells would take 27s (9×3s) instead of 3s. Spawning a goroutine per task lets all LLM calls run in parallel. Goroutines are cheap (~2KB each) so this is safe at demo scale. For production with a real API, a worker pool would cap concurrent calls to avoid rate limits.

### Why exponential backoff + retry?
They solve different problems. Backoff reduces wasted poll requests while waiting for a slow LLM response. Retry re-submits a fresh task when the LLM actually returns an error — re-polling the same `task_id` would just keep getting the same error. Together they make the system resilient to both latency and transient failures.

### Why min 1 row and 1 column?
An empty table has no meaningful state to run against. Preventing deletion of the last row/column avoids an edge case where Run is clicked on an empty table, and keeps the UI from reaching an unrecoverable state without a page refresh.

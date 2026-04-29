Design & System Design Decisions

---

Backend Architecture

Why Go?  
 Goroutines are cheap (~2KB each) and make concurrency trivial. A buffered channel dispatches tasks to a coordinator goroutine,
which spawns a goroutine per task — all LLM calls run in parallel with no thread pool management.

Why async queue + polling instead of streaming?  
 Streaming requires a persistent connection per cell. An N×M table means N×M open connections simultaneously. A queue decouples
submission from completion — each cell submits instantly, gets a task_id, then polls independently. Scales better, simpler to  
 reason about.

Why goroutine per task instead of a single serial worker?  
 Serial processing means 9 cells take 27s (9×3s). Goroutines make parallelism free — all 9 complete in ~3s. For production with a
real API, a worker pool would cap concurrency to avoid rate limits.

Why no database?  
 Table state is small, single-user, and always replaced atomically. A single PUT /table keeps the backend stateless — no schema, no
migrations, no connection pooling.

Why a single PUT /table instead of partial updates?  
 Atomic replacement avoids merge conflicts and partial-update endpoints. The state is small enough that replacing it wholesale is
cheaper than maintaining granular endpoints.

Why sync.Map for task results?  
 Multiple goroutines write results concurrently (one per task) while the polling handler reads them. sync.Map is the right
primitive — concurrent-safe without explicit locking.

---

Frontend Architecture

Why no external state library?  
 State shape is flat — rows, columns, Record<string, CellValue>. useState + useCallback is sufficient. Redux or Zustand would add  
 complexity without benefit.

Why Promise.all fan-out?  
 All cells submit and poll concurrently. No cell waits for another. Cells update independently as their polls resolve — fast tasks
appear immediately.

Why exponential backoff?  
 Reduces wasted poll requests during slow LLM calls. Starts at 1s, doubles each miss, caps at 8s. With a real API taking 5-10s,
this saves several unnecessary requests per cell.

Why automatic retry?  
 Backoff alone can't recover from a failed task — re-polling the same task_id keeps returning the same error. Retry re-submits a
fresh task. Up to 3 retries before showing error. Handles transient failures (rate limits, timeouts).

Why smart re-run?  
 Clicking Run doesn't blindly re-run everything. Only idle cells, error cells, or cells where ticker/prompt changed since last run
are re-fired. Adding one row only re-runs that row's cells, not the whole table.

---

UI/UX Decisions

Why drag-and-drop for reordering?  
 Arrow buttons require multiple clicks to move items several positions. Drag-and-drop is the natural mental model for reordering  
 tabular data.

Why is reordering safe during a run?  
 Rows and columns are identified by stable IDs generated at creation, never by position. Cell results are stored as "rowId:colId" —
reordering mid-flight doesn't affect where results land.

Why prevent duplicate tickers?  
 Two rows with the same ticker would produce identical LLM calls and identical results. Prevented at the UI level — addRow picks
the first unused ticker, updateTicker blocks if the target is already used.

Why min 1 row and 1 column?  
 An empty table has no state to run against. Hiding the remove button at minimum prevents an unrecoverable blank state without a
page refresh.

Why disable Run on empty column prompts?  
 An empty prompt produces a meaningless LLM call. Disabled state makes the constraint visible rather than silently skipping
columns.

Why save prompts on Run, not on keystroke?  
 Saving on every keystroke would flood the backend with PUT /table requests. Prompts are local state until Run is clicked, then
persisted alongside cell results in one atomic write.

Why mock-first?  
 The LLM swap is a one-function change in queue/llm.go. Building mock-first validated the entire UI/polling/retry flow without
needing an API key or incurring cost.

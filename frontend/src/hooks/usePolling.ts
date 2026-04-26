import type { TableState, CellValue, Row, Column } from "../types"
import { submitLLM, pollTask } from "../api"

const POLL_INTERVAL_MS = 1500

export interface RunSnapshot {
  rows: Row[]
  columns: Column[]
}

function needsRun(
  rowId: string,
  colId: string,
  ticker: string,
  prompt: string,
  cellStatus: CellValue["status"],
  prev: RunSnapshot | null,
): boolean {
  if (cellStatus === "idle") return true
  if (!prev) return true

  const prevRow = prev.rows.find(r => r.id === rowId)
  const prevCol = prev.columns.find(c => c.id === colId)

  if (!prevRow || !prevCol) return true // new row or column
  if (prevRow.ticker !== ticker) return true
  if (prevCol.prompt !== prompt) return true

  return false
}

async function pollUntilDone(
  taskId: string,
  onResult: (value: string) => void,
  onError: (err: string) => void,
): Promise<void> {
  return new Promise(resolve => {
    const timer = setInterval(async () => {
      try {
        const res = await pollTask(taskId)
        if (res.status === "done") {
          clearInterval(timer)
          onResult(res.result ?? "")
          resolve()
        } else if (res.status === "error") {
          clearInterval(timer)
          onError(res.result ?? "LLM error")
          resolve()
        }
      } catch (err) {
        clearInterval(timer)
        onError(String(err))
        resolve()
      }
    }, POLL_INTERVAL_MS)
  })
}

export async function runAllCells(
  table: TableState,
  updateCell: (rowId: string, colId: string, patch: Partial<CellValue>) => void,
  getCell: (rowId: string, colId: string) => CellValue,
  prev: RunSnapshot | null,
): Promise<void> {
  const tasks: Promise<void>[] = []

  for (const row of table.rows) {
    for (const col of table.columns) {
      if (!col.prompt.trim()) continue

      const cell = getCell(row.id, col.id)
      if (!needsRun(row.id, col.id, row.ticker, col.prompt, cell.status, prev)) continue

      updateCell(row.id, col.id, { status: "loading", value: null })

      const prompt = `Stock ticker: ${row.ticker}\n\n${col.prompt}`

      const task = submitLLM(prompt)
        .then(({ task_id }) =>
          pollUntilDone(
            task_id,
            value => updateCell(row.id, col.id, { status: "done", value }),
            err => updateCell(row.id, col.id, { status: "error", value: err }),
          )
        )
        .catch(err => updateCell(row.id, col.id, { status: "error", value: String(err) }))

      tasks.push(task)
    }
  }

  await Promise.all(tasks)
}

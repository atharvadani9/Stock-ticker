import { pollTaskApi, submitLlmApi } from "../api";
import type { CellValue, Column, Row, TableState } from "../types";

const POLL_INITIAL_MS = 1000;
const POLL_MAX_MS = 8000;
const POLL_TIMEOUT_MS = 120_000;

export interface RunSnapshot {
  rows: Row[];
  columns: Column[];
}

function needsRun(
  rowId: string,
  colId: string,
  ticker: string,
  prompt: string,
  cellStatus: CellValue["status"],
  prev: RunSnapshot | null,
): boolean {
  if (cellStatus === "idle" || cellStatus === "error") return true;
  if (!prev) return true;

  const prevRow = prev.rows.find((r) => r.id === rowId);
  const prevCol = prev.columns.find((c) => c.id === colId);

  if (!prevRow || !prevCol) return true; // new row or column
  if (prevRow.ticker !== ticker) return true;
  if (prevCol.prompt !== prompt) return true;

  return false;
}

async function submitAndPoll(
  prompt: string,
  onResult: (value: string) => void,
  onError: (err: string) => void,
): Promise<void> {
  let taskId: string;
  try {
    const res = await submitLlmApi(prompt);
    taskId = res.task_id;
  } catch (err) {
    onError(String(err));
    return;
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let delay = POLL_INITIAL_MS;
  while (true) {
    if (Date.now() > deadline) {
      onError("timed out waiting for LLM response");
      return;
    }
    await new Promise((r) => setTimeout(r, delay));
    try {
      const res = await pollTaskApi(taskId);
      if (res.status === "done") {
        onResult(res.result ?? "");
        return;
      }
      if (res.status === "error") {
        onError(res.result ?? "LLM error");
        return;
      }
    } catch (err) {
      onError(String(err));
      return;
    }
    delay = Math.min(delay * 2, POLL_MAX_MS);
  }
}

export async function runAllCells(
  table: TableState,
  updateCell: (rowId: string, colId: string, patch: Partial<CellValue>) => void,
  getCell: (rowId: string, colId: string) => CellValue,
  prev: RunSnapshot | null,
): Promise<void> {
  const tasks: Promise<void>[] = [];

  for (const row of table.rows) {
    for (const col of table.columns) {
      if (!col.prompt.trim()) continue;

      const cell = getCell(row.id, col.id);
      if (!needsRun(row.id, col.id, row.ticker, col.prompt, cell.status, prev))
        continue;

      updateCell(row.id, col.id, { status: "loading", value: null });

      const prompt = `Stock ticker: ${row.ticker}\n\n${col.prompt}`;

      const task = submitAndPoll(
        prompt,
        (value) => updateCell(row.id, col.id, { status: "done", value }),
        (err) => updateCell(row.id, col.id, { status: "error", value: err }),
      );

      tasks.push(task);
    }
  }

  await Promise.all(tasks);
}

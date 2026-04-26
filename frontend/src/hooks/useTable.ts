import { useState, useEffect, useCallback } from "react"
import type { TableState, CellValue, Ticker } from "../types"
import { TICKERS } from "../types"
import { fetchTable, saveTable } from "../api"

let _counter = 0
function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${++_counter}`
}

export function useTable() {
  const [table, setTable] = useState<TableState>({ rows: [], columns: [], cells: {} })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTable()
      .then(t => { setTable(t); setLoading(false) })
      .catch(console.error)
  }, [])

  const sync = useCallback((next: TableState) => {
    setTable(next)
    saveTable(next).catch(console.error)
  }, [])

  const addRow = useCallback(() => {
    const used = new Set(table.rows.map(r => r.ticker))
    const next = TICKERS.find(t => !used.has(t))
    if (!next) return // all tickers already in use
    sync({
      ...table,
      rows: [...table.rows, { id: newId("row"), ticker: next }],
    })
  }, [table, sync])

  const addColumn = useCallback(() => {
    sync({
      ...table,
      columns: [...table.columns, { id: newId("col"), prompt: "" }],
    })
  }, [table, sync])

  const updateTicker = useCallback((rowId: string, ticker: Ticker) => {
    const used = new Set(table.rows.filter(r => r.id !== rowId).map(r => r.ticker))
    if (used.has(ticker)) return // ticker already in another row
    sync({
      ...table,
      rows: table.rows.map(r => r.id === rowId ? { ...r, ticker } : r),
    })
  }, [table, sync])

  const updatePrompt = useCallback((colId: string, prompt: string) => {
    setTable(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, prompt } : c),
    }))
  }, [])

  // Local-only during a run — no PUT /table until run completes
  const updateCell = useCallback((rowId: string, colId: string, patch: Partial<CellValue>) => {
    setTable(prev => {
      const key = `${rowId}:${colId}`
      return {
        ...prev,
        cells: { ...prev.cells, [key]: { ...prev.cells[key], ...patch } },
      }
    })
  }, [])

  const getCell = useCallback((rowId: string, colId: string): CellValue => {
    return table.cells[`${rowId}:${colId}`] ?? { value: null, status: "idle" }
  }, [table])

  const deleteRow = useCallback((rowId: string) => {
    const cells = { ...table.cells }
    table.columns.forEach(c => delete cells[`${rowId}:${c.id}`])
    sync({ ...table, rows: table.rows.filter(r => r.id !== rowId), cells })
  }, [table, sync])

  const deleteColumn = useCallback((colId: string) => {
    const cells = { ...table.cells }
    table.rows.forEach(r => delete cells[`${r.id}:${colId}`])
    sync({ ...table, columns: table.columns.filter(c => c.id !== colId), cells })
  }, [table, sync])

  const persistCells = useCallback(() => {
    saveTable(table).catch(console.error)
  }, [table])

  return { table, loading, addRow, addColumn, deleteRow, deleteColumn, updateTicker, updatePrompt, updateCell, getCell, persistCells }
}

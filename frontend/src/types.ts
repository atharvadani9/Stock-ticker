export const TICKERS = ["TSLA", "NVDA", "AAPL", "GOOGL", "MSFT", "AMZN", "META", "NFLX", "AMD", "INTC"] as const

export type Ticker = typeof TICKERS[number]
export type CellStatus = "idle" | "loading" | "done" | "error"

export interface Column {
  id: string
  prompt: string
}

export interface Row {
  id: string
  ticker: Ticker
}

export interface CellValue {
  value: string | null
  status: CellStatus
}

export interface TableState {
  rows: Row[]
  columns: Column[]
  cells: Record<string, CellValue>
}

export interface PollResponse {
  status: "pending" | "done" | "error"
  result?: string
}

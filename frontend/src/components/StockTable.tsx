import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material"
import { useRef, useState } from "react"
import { runAllCells, type RunSnapshot } from "../hooks/usePolling"
import { useTable } from "../hooks/useTable"
import type { Ticker } from "../types"
import { AiCell } from "./AiCell"
import { ColumnHeader } from "./ColumnHeader"
import { TickerCell } from "./TickerCell"

export function StockTable() {
  const {
    table,
    loading,
    addRow,
    addColumn,
    deleteRow,
    deleteColumn,
    updateTicker,
    updatePrompt,
    updateCell,
    getCell,
    persistCells,
  } = useTable()
  const [isRunning, setIsRunning] = useState(false)
  const lastRun = useRef<RunSnapshot | null>(null)

  const handleRun = async () => {
    setIsRunning(true)
    await runAllCells(table, updateCell, getCell, lastRun.current)
    lastRun.current = {
      rows: table.rows.map(r => ({ ...r })),
      columns: table.columns.map(c => ({ ...c })),
    }
    persistCells()
    setIsRunning(false)
  }

  if (loading) return null

  const usedTickers = new Set(table.rows.map(r => r.ticker)) as Set<Ticker>
  const hasEmptyColumn = table.columns.some(col => !col.prompt.trim())

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f0f4f8" }}>
              <TableCell sx={{ fontWeight: 700, borderBottom: "2px solid #e0e7ef" }}>Ticker</TableCell>
              {table.columns.map(col => (
                <TableCell key={col.id} sx={{ borderBottom: "2px solid #e0e7ef" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <ColumnHeader key={col.id} column={col} onChange={updatePrompt} />
                    {table.columns.length > 1 && (
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => deleteColumn(col.id)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              ))}
              <TableCell padding="none" sx={{ borderBottom: "2px solid #e0e7ef" }}>
                <Tooltip title="Add Column">
                  <IconButton size="small" onClick={addColumn}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map(row => (
              <TableRow key={row.id} sx={{ verticalAlign: "top" }}>
                <TableCell sx={{ pt: 1.5 }}>
                  <TickerCell
                    rowId={row.id}
                    ticker={row.ticker}
                    usedTickers={usedTickers}
                    onChange={updateTicker}
                  />
                </TableCell>
                {table.columns.map(col => (
                  <TableCell key={col.id} sx={{ pt: 1.5 }}>
                    <AiCell cell={getCell(row.id, col.id)} />
                  </TableCell>
                ))}
                <TableCell padding="none" sx={{ pt: 1.5 }}>
                  {table.rows.length > 1 && (
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => deleteRow(row.id)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={table.columns.length + 2} sx={{ borderBottom: "none" }}>
                <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ color: "text.secondary" }}>
                  Add Row
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider />
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, py: 1.5 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PlayArrowIcon />}
          onClick={handleRun}
          disabled={isRunning || hasEmptyColumn}
        >
          {isRunning ? "Running…" : "Run"}
        </Button>
      </Box>
    </Paper>
  )
}

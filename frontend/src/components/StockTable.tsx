import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
import type { CellValue, Column, Row, Ticker } from "../types"
import { AiCell } from "./AiCell"
import { ColumnHeader } from "./ColumnHeader"
import { TickerCell } from "./TickerCell"

function SortableRow({ row, columns, usedTickers, updateTicker, getCell, deleteRow, showDelete }: {
  row: Row
  columns: Column[]
  usedTickers: Set<Ticker>
  updateTicker: (rowId: string, ticker: Ticker) => void
  getCell: (rowId: string, colId: string) => CellValue
  deleteRow: (rowId: string) => void
  showDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id })
  return (
    <TableRow
      ref={setNodeRef}
      sx={{ verticalAlign: "top", opacity: isDragging ? 0.5 : 1, transition }}
      style={{ transform: CSS.Transform.toString(transform) }}
    >
      <TableCell sx={{ pt: 1.5, pr: 0, width: 24 }}>
        <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled", cursor: "grab", mt: 0.5 }} {...attributes} {...listeners} />
      </TableCell>
      <TableCell sx={{ pt: 1.5 }}>
        <TickerCell rowId={row.id} ticker={row.ticker} usedTickers={usedTickers} onChange={updateTicker} />
      </TableCell>
      {columns.map(col => (
        <TableCell key={col.id} sx={{ pt: 1.5 }}>
          <AiCell cell={getCell(row.id, col.id)} />
        </TableCell>
      ))}
      <TableCell padding="none" sx={{ pt: 1.5 }}>
        {showDelete && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => deleteRow(row.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  )
}

export function StockTable() {
  const {
    table, loading, addRow, addColumn, deleteRow, deleteColumn,
    updateTicker, updatePrompt, updateCell, getCell, persistCells,
    reorderRows, reorderColumns,
  } = useTable()
  const [isRunning, setIsRunning] = useState(false)
  const lastRun = useRef<RunSnapshot | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  const handleRowDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) reorderRows(String(active.id), String(over.id))
  }

  const handleColDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (over && active.id !== over.id) reorderColumns(String(active.id), String(over.id))
  }

  if (loading) return null

  const usedTickers = new Set(table.rows.map(r => r.ticker)) as Set<Ticker>
  const hasEmptyColumn = table.columns.some(col => !col.prompt.trim())

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColDragEnd}>
              <SortableContext items={table.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                <TableRow sx={{ bgcolor: "#f0f4f8" }}>
                  <TableCell sx={{ borderBottom: "2px solid #e0e7ef", width: 24 }} />
                  <TableCell sx={{ fontWeight: 700, borderBottom: "2px solid #e0e7ef" }}>Ticker</TableCell>
                  {table.columns.map(col => (
                    <SortableColumnHeader
                      key={col.id}
                      col={col}
                      updatePrompt={updatePrompt}
                      deleteColumn={deleteColumn}
                      showDelete={table.columns.length > 1}
                    />
                  ))}
                  <TableCell padding="none" sx={{ borderBottom: "2px solid #e0e7ef" }}>
                    <Tooltip title="Add Column">
                      <IconButton size="small" onClick={addColumn}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </SortableContext>
            </DndContext>
          </TableHead>
          <TableBody>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
              <SortableContext items={table.rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {table.rows.map(row => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    columns={table.columns}
                    usedTickers={usedTickers}
                    updateTicker={updateTicker}
                    getCell={getCell}
                    deleteRow={deleteRow}
                    showDelete={table.rows.length > 1}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <TableRow>
              <TableCell colSpan={table.columns.length + 3} sx={{ borderBottom: "none" }}>
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

function SortableColumnHeader({ col, updatePrompt, deleteColumn, showDelete }: {
  col: Column
  updatePrompt: (colId: string, prompt: string) => void
  deleteColumn: (colId: string) => void
  showDelete: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  return (
    <TableCell
      ref={setNodeRef}
      sx={{ borderBottom: "2px solid #e0e7ef", opacity: isDragging ? 0.5 : 1, transition }}
      style={{ transform: CSS.Transform.toString(transform) }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled", cursor: "grab", flexShrink: 0 }} {...attributes} {...listeners} />
        <ColumnHeader key={col.id} column={col} onChange={updatePrompt} />
        {showDelete && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => deleteColumn(col.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </TableCell>
  )
}

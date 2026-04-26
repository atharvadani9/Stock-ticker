import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useRef, useState } from "react";
import { runAllCells, type RunSnapshot } from "../hooks/usePolling";
import { useTable } from "../hooks/useTable";
import type { Ticker } from "../types";
import { AiCell } from "./AiCell";
import { ColumnHeader } from "./ColumnHeader";
import { TickerCell } from "./TickerCell";
import { Toolbar } from "./Toolbar";

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
  } = useTable();
  const [isRunning, setIsRunning] = useState(false);
  const lastRun = useRef<RunSnapshot | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    await runAllCells(table, updateCell, getCell, lastRun.current);
    lastRun.current = {
      rows: table.rows.map((r) => ({ ...r })),
      columns: table.columns.map((c) => ({ ...c })),
    };
    persistCells();
    setIsRunning(false);
  };

  if (loading) return null;

  const usedTickers = new Set(table.rows.map((r) => r.ticker)) as Set<Ticker>;

  return (
    <>
      <Toolbar
        isRunning={isRunning}
        onRun={handleRun}
        onAddRow={addRow}
        onAddColumn={addColumn}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Ticker</TableCell>
              {table.columns.map((col) => (
                <TableCell key={col.id}>
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
                  >
                    <ColumnHeader
                      key={col.id}
                      column={col}
                      onChange={updatePrompt}
                    />
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => deleteColumn(col.id)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <TickerCell
                    rowId={row.id}
                    ticker={row.ticker}
                    usedTickers={usedTickers}
                    onChange={updateTicker}
                  />
                </TableCell>
                {table.columns.map((col) => (
                  <TableCell key={col.id}>
                    <AiCell cell={getCell(row.id, col.id)} />
                  </TableCell>
                ))}
                <TableCell padding="none">
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => deleteRow(row.id)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

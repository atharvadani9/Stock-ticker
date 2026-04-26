import { MenuItem, Select } from "@mui/material";
import { TICKERS, type Ticker } from "../types";

interface Props {
  rowId: string;
  ticker: Ticker;
  usedTickers: Set<Ticker>;
  onChange: (rowId: string, ticker: Ticker) => void;
}

export function TickerCell({ rowId, ticker, usedTickers, onChange }: Props) {
  return (
    <Select
      value={ticker}
      size="small"
      variant="standard"
      onChange={(e) => onChange(rowId, e.target.value as Ticker)}
    >
      {TICKERS.map((t) => (
        <MenuItem
          key={t}
          value={t}
          disabled={t !== ticker && usedTickers.has(t)}
        >
          {t}
        </MenuItem>
      ))}
    </Select>
  );
}

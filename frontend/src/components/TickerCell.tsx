import { MenuItem, Select } from "@mui/material"
import { TICKERS, type Ticker } from "../types"

interface Props {
  rowId: string
  ticker: Ticker
  usedTickers: Set<Ticker>
  onChange: (rowId: string, ticker: Ticker) => void
}

export function TickerCell({ rowId, ticker, usedTickers, onChange }: Props) {
  return (
    <Select
      value={ticker}
      size="small"
      variant="outlined"
      onChange={e => onChange(rowId, e.target.value as Ticker)}
      sx={{
        fontWeight: 700,
        fontSize: "0.9rem",
        color: "#1565c0",
        bgcolor: "#e3f2fd",
        borderRadius: "16px",
        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        "& .MuiSelect-select": { py: "4px", px: "12px" },
        "& .MuiSelect-icon": { color: "#1565c0" },
      }}
    >
      {TICKERS.map(t => (
        <MenuItem
          key={t}
          value={t}
          disabled={t !== ticker && usedTickers.has(t)}
          sx={{
            fontWeight: 700,
            fontSize: "0.9rem",
            color: t === ticker ? "#1565c0" : "text.primary",
            "&.Mui-selected": {
              bgcolor: "#e3f2fd",
              color: "#1565c0",
              "&:hover": { bgcolor: "#bbdefb" },
            },
            "&:hover": { bgcolor: "#e3f2fd", color: "#1565c0" },
            "&.Mui-disabled": { opacity: 0.4 },
          }}
        >
          {t}
        </MenuItem>
      ))}
    </Select>
  )
}

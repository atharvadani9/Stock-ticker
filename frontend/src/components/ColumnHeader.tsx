import { useState } from "react"
import { TextField } from "@mui/material"
import type { Column } from "../types"

interface Props {
  column: Column
  onChange: (colId: string, prompt: string) => void
}

export function ColumnHeader({ column, onChange }: Props) {
  const [draft, setDraft] = useState(column.prompt)

  return (
    <TextField
      value={draft}
      onChange={e => {
        setDraft(e.target.value)
        onChange(column.id, e.target.value)
      }}
      placeholder="Enter prompt…"
      size="small"
      multiline
      maxRows={4}
      sx={{ minWidth: 200 }}
    />
  )
}

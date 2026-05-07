import { TextField } from "@mui/material";
import type { Column } from "../types";

interface Props {
  column: Column;
  onChange: (colId: string, prompt: string) => void;
}

export function ColumnHeader({ column, onChange }: Props) {
  return (
    <TextField
      value={column.prompt}
      onChange={(e) => onChange(column.id, e.target.value)}
      placeholder={"e.g. What was revenue last year?"}
      size="small"
      multiline
      minRows={2}
      maxRows={6}
      sx={{ minWidth: 200 }}
    />
  );
}

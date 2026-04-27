import { TextField } from "@mui/material";
import { useState } from "react";
import type { Column } from "../types";

interface Props {
  column: Column;
  onChange: (colId: string, prompt: string) => void;
}

export function ColumnHeader({ column, onChange }: Props) {
  const [draft, setDraft] = useState(column.prompt);

  return (
    <TextField
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(column.id, e.target.value);
      }}
      placeholder="e.g. What was revenue last year?"
      size="small"
      multiline
      minRows={2}
      maxRows={6}
      sx={{ minWidth: 200 }}
    />
  );
}

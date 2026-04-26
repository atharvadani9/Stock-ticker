import { Box, CircularProgress, Typography } from "@mui/material";
import type { CellValue } from "../types";

interface Props {
  cell: CellValue;
}

export function AiCell({ cell }: Props) {
  if (cell.status === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={14} />
        <Typography variant="body2" color="text.secondary">
          {"Generating…"}
        </Typography>
      </Box>
    );
  }

  if (cell.status === "error") {
    return (
      <Typography variant="body2" color="error">
        {cell.value}
      </Typography>
    );
  }

  if (cell.status === "done") {
    return <Typography variant="body2">{cell.value}</Typography>;
  }

  return null;
}

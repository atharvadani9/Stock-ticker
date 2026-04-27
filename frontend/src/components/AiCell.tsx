import { Box, CircularProgress, Typography } from "@mui/material"
import type { CellValue } from "../types"

interface Props {
  cell: CellValue
}

export function AiCell({ cell }: Props) {
  if (cell.status === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
        <CircularProgress size={13} />
        <Typography variant="body2" color="text.secondary">Generating…</Typography>
      </Box>
    )
  }

  if (cell.status === "error") {
    return (
      <Box sx={{ bgcolor: "#fff5f5", borderRadius: 1, px: 1, py: 0.5 }}>
        <Typography variant="body2" color="error">{cell.value}</Typography>
      </Box>
    )
  }

  if (cell.status === "done") {
    return (
      <Box sx={{ bgcolor: "#f0f7ff", borderRadius: 1, px: 1, py: 0.5 }}>
        <Typography variant="body2" color="text.primary">{cell.value}</Typography>
      </Box>
    )
  }

  // idle
  return (
    <Typography variant="body2" color="text.disabled" sx={{ px: 1 }}>—</Typography>
  )
}

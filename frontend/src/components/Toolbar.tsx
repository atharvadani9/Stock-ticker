import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { Box, Button } from "@mui/material"

interface Props {
  isRunning: boolean
  onRun: () => void
}

export function Toolbar({ isRunning, onRun }: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PlayArrowIcon />}
        onClick={onRun}
        disabled={isRunning}
      >
        {isRunning ? "Running…" : "Run"}
      </Button>
    </Box>
  )
}

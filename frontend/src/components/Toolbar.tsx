import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box, Button } from "@mui/material";

interface Props {
  isRunning: boolean;
  onRun: () => void;
  onAddRow: () => void;
  onAddColumn: () => void;
}

export function Toolbar({ isRunning, onRun, onAddRow, onAddColumn }: Props) {
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
      <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddRow}>
        {"Add Row"}
      </Button>
      <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddColumn}>
        {"Add Column"}
      </Button>
    </Box>
  );
}

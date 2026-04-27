import { Container, Box } from "@mui/material"
import { StockTable } from "./components/StockTable"

function App() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 5 }}>
      <Container maxWidth="xl">
        <StockTable />
      </Container>
    </Box>
  )
}

export default App

import { Container, Typography } from "@mui/material";
import { StockTable } from "./components/StockTable";

function App() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        {"Stock Ticker AI Table"}
      </Typography>
      <StockTable />
    </Container>
  );
}

export default App;

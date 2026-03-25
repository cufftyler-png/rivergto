import express from "express";
import cors from "cors";
import { solveRoute } from "./routes/solve.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.send("RiverGTO backend is running.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/solve", solveRoute);

const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`Poker solver server running on http://localhost:${PORT}`);
});
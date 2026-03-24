import express from "express";
import cors from "cors";
import { solveRoute } from "./routes/solve.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://rivergto.com",
  "https://www.rivergto.com",
  "https://rivergto.vercel.app",
  "https://www.rivergto.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
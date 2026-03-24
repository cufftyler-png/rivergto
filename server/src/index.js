import express from "express";
import cors from "cors";
import { solveRoute } from "./routes/solve.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://rivergto.com",
  "https://www.rivergto.com",
];

app.use(
  cors({
    origin(origin, callback) {
      // allow no-origin requests like health checks / curl / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("*", cors());

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
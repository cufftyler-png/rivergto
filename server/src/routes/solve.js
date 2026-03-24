import { runSolve } from "../engine/simulate.js";

export async function solveRoute(req, res) {
  try {
    const result = await runSolve(req.body);
    res.json(result);
  } catch (error) {
    console.error("Solve route error:", error);
    res.status(500).json({
      error: "Solve failed",
    });
  }
}
export function createWorker() {
  return new Worker("/worker/solver.worker.js");
}
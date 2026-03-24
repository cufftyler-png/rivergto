import { useEffect, useRef, useState } from "react";
import { createWorker } from "../workerClient";
import { useDebouncedValue } from "./useDebouncedValue";
import { solveViaApi } from "../solver/api";

export function useSolver(payload: any, mode: "worker" | "api") {
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Idle");

  const workerRef = useRef<Worker | null>(null);
  const requestId = useRef(0);

  const debouncedPayload = useDebouncedValue(payload, 250);

  useEffect(() => {
    workerRef.current = createWorker();

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  async function solve(forcePayload?: any) {
    const nextPayload = forcePayload ?? debouncedPayload;

    setProgress(0);
    setStatus("Queued");
    setResult(null);

    if (mode === "api") {
      setStatus("Calling backend");
      setProgress(30);

      const apiResult = await solveViaApi(nextPayload);

      setProgress(100);
      setStatus(apiResult?.error ? "Failed" : "Solved");
      setResult(apiResult);
      return;
    }

    if (!workerRef.current) return;

    const id = ++requestId.current;

    workerRef.current.onmessage = (e: MessageEvent<any>) => {
      if (e.data.requestId !== id) return;

      if (typeof e.data.progress === "number") {
        setProgress(e.data.progress);
      }

      if (e.data.status) {
        setStatus(e.data.status);
      }

      if (e.data.result) {
        setResult(e.data.result);
      }
    };

    workerRef.current.postMessage({
      requestId: id,
      payload: nextPayload,
    });
  }

  return { result, progress, status, solve };
}
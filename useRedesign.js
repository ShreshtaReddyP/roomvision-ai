import { useCallback, useRef, useState } from "react";
import { generateRedesign } from "../services/api";

/** Runs one redesign request and tracks its state: idle, processing, done or error. */
export function useRedesign() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const controllerRef = useRef(null);

  const run = useCallback(async (file, form) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("processing");
    setError("");
    try {
      const data = await generateRedesign(file, form, controller.signal);
      setResult(data);
      setStatus("done");
      return data;
    } catch (err) {
      if (err.code === "aborted") {
        setStatus("idle");
        return null;
      }
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
      return null;
    }
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);
  const clearError = useCallback(() => {
    setError("");
    setStatus((s) => (s === "error" ? "idle" : s));
  }, []);
  const reset = useCallback(() => {
    setResult(null);
    setError("");
    setStatus("idle");
  }, []);

  return { status, error, result, run, cancel, clearError, reset };
}

import { useCallback, useState } from "react";

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async (fn) => {
    setBusy(true);
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e?.message || "Internal error");
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}

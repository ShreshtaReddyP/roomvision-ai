import { useCallback, useEffect, useState } from "react";
import { checkHealth } from "../services/api";

/** Pings /health. This also wakes a sleeping Render server before the user needs it. */
export function useBackendStatus() {
  const [state, setState] = useState({ status: "checking", info: null });

  const check = useCallback(() => {
    setState((s) => ({ ...s, status: "checking" }));
    checkHealth()
      .then((info) => setState({ status: "online", info }))
      .catch(() => setState({ status: "offline", info: null }));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { ...state, recheck: check };
}

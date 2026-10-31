import { useCallback, useEffect, useState } from "react";
import { errorText } from "./api";

/** Load data on mount (and when `key` changes); `reload()` fetches again. */
export function useLoad<T>(load: () => Promise<T>, key = ""): { data: T | null; error: string; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [n, setN] = useState(0);
  useEffect(() => {
    let off = false;
    load()
      .then((d) => {
        if (off) return;
        setData(d);
        setError("");
      })
      .catch((err) => !off && setError(errorText(err, "Couldn't load this.")));
    return () => {
      off = true;
    };
    // `load` is recreated each render; `key` and `n` decide when to fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, n]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { data, error, reload };
}

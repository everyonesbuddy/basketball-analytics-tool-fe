import { useState } from "react";
import os, { errorText } from "../api";
import { useLoad } from "../useLoad";
import type { CareView } from "./types";

/** Load the care view, and replace it with each change's response. */
export function useCare() {
  const { data, error, reload } = useLoad<CareView>(() => os.get("/gifting/care").then((r) => r.data));
  const [override, setOverride] = useState<CareView | null>(null);
  const [actError, setActError] = useState("");
  const view = override || data;
  const act = async (call: () => Promise<{ data: CareView }>) => {
    setActError("");
    try {
      setOverride((await call()).data);
    } catch (err) {
      setActError(errorText(err, "Couldn't save that."));
    }
  };
  return { view, error: error || actError, act, reload };
}


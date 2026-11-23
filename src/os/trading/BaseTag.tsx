import { BASE_COLOR, BASE_NAME } from "./format";
import type { BaseKey } from "./types";

export function BaseTag({ base }: { base: BaseKey }) {
  const c = BASE_COLOR[base];
  return (
    <span
      className="os-tr-base"
      style={{ color: c, background: `${c}14`, borderColor: `${c}40` }}
    >
      {BASE_NAME[base]}
    </span>
  );
}

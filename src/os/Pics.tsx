import { FiImage } from "react-icons/fi";
import { ideasLink } from "./links";

/** A small link to a Pinterest search for pictures of this exact thing. */
export function Pics({ q, label }: { q: string; label?: string }) {
  return (
    <a className="os-pics" href={ideasLink(q)} target="_blank" rel="noreferrer" title={`Pictures: ${q}`}>
      <FiImage /> {label || "pictures"}
    </a>
  );
}

import { FiExternalLink, FiMapPin, FiStar } from "react-icons/fi";
import { clock, shortDate } from "../format";
import type { SavedEvent, SavedStatus, TmEvent } from "./types";
import { onsaleText } from "./util";

const price = (e: { priceMin: number | null; priceMax: number | null }) =>
  e.priceMin === null ? "" : e.priceMax && e.priceMax !== e.priceMin ? `$${Math.round(e.priceMin)}–$${Math.round(e.priceMax)}` : `$${Math.round(e.priceMin)}`;

const STATUS_NOTE: Record<string, string> = { offsale: "Off sale", cancelled: "Cancelled", postponed: "Postponed", rescheduled: "Rescheduled" };

/** One event: date, name, where, price, on-sale time; tickets link and save. */
export default function EventRow({ e, saved, onSave }: { e: TmEvent; saved?: SavedEvent; onSave: (e: TmEvent, status: SavedStatus) => void }) {
  const when = e.date ? `${shortDate(e.date, true)}${e.time ? ` · ${clock(e.time.slice(0, 5))}` : ""}` : "Date TBA";
  const sale = onsaleText(e.onsaleAt);
  return (
    <div className="os-event">
      <div className="os-event__date">
        <strong>{e.date ? new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, { month: "short" }) : "TBA"}</strong>
        <span>{e.date ? Number(e.date.slice(8)) : ""}</span>
      </div>
      <div className="os-event__body">
        <strong>{e.name}</strong>
        <span className="os-small os-muted">
          {when} · {[e.venue, e.city].filter(Boolean).join(", ")}
          {e.distance !== null && <> · <FiMapPin /> {e.distance} mi</>}
        </span>
        <span className="os-small">
          {[price(e), e.genre, STATUS_NOTE[e.status], sale].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div className="os-event__actions">
        {e.url && (
          <a className="os-btn os-btn--small" href={e.url} target="_blank" rel="noreferrer">
            Tickets <FiExternalLink />
          </a>
        )}
        {saved ? (
          <span className="os-tag os-tag--ok"><FiStar /> {saved.status === "bought" ? "Got tickets" : saved.status === "going" ? "Going" : "Saved"}</span>
        ) : (
          <>
            <button className="os-link os-small" onClick={() => onSave(e, "interested")}><FiStar /> Save</button>
            <button className="os-link os-small" onClick={() => onSave(e, "going")}>Going</button>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import os from "./api";
import { CategoryTag } from "./Bits";
import { clock } from "./format";
import type { Today } from "./types";
import { nextWhat, whenText } from "./when";

/**
 * The strip at the top of every page: what to work on now (and its next
 * step), or that nothing's on, and what's next and when. Refreshes every minute.
 * Notifications on your phone are set up in Settings.
 */
export default function NowBar() {
  const { pathname } = useLocation();
  const [today, setToday] = useState<Today | null>(null);
  useEffect(() => {
    let off = false;
    const load = () =>
      os
        .get("/today")
        .then((r) => !off && setToday(r.data))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 60000);
    return () => {
      off = true;
      window.clearInterval(t);
    };
  }, [pathname]);

  if (!today || pathname === "/") return null;
  const f = today.focus;
  const b = f.block;
  const n = f.next;

  return (
    <div className="os-nowbar no-print">
      <div className="os-nowbar__main">
        <span className="os-kicker">Now</span>
        {f.state === "goal" && b ? (
          <>
            {b.category && <CategoryTag category={b.category} />}
            <strong>{b.goalTitle || `${b.label}: no goal set`}</strong>
            <span className="os-muted os-small">until {clock(b.end)}</span>
          </>
        ) : f.state === "review" ? (
          <>
            <strong>Weekly review</strong>
            <Link to="/review">Open it</Link>
          </>
        ) : (
          <strong>{f.state === "break" && b ? b.label : f.state === "free" ? "Nothing scheduled" : "Off schedule"}</strong>
        )}
        {n && (
          <span className="os-muted os-small os-nowbar__next">
            Next {whenText(n)}: {nextWhat(n)}
          </span>
        )}
      </div>
      <div className="os-nowbar__side">
        {f.state === "goal" && b?.goalId && !b.loggedToday && <Link to="/">Moved it forward today?</Link>}
        <Link to="/settings#notifications" title="Push notifications on your phone">
          <FiBell /> Notifications
        </Link>
      </div>
    </div>
  );
}

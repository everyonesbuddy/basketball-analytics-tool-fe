import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiBell, FiBellOff } from "react-icons/fi";
import os from "./api";
import { CategoryTag } from "./Bits";
import { clock } from "./format";
import type { Today } from "./types";
import { nextWhat, whenText } from "./when";

const KEY = "personal_os_block_reminders";
const readPref = () => {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
};
const savePref = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // storage blocked: the choice lasts until the tab closes
  }
};
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const canNotify = () => typeof window !== "undefined" && "Notification" in window;

/**
 * The strip at the top of every page: what to work on now (and its next
 * step), or that nothing's on, and what's next and when. Refreshes every minute. Optional reminders: a
 * browser notification when each goal block starts (while the app is open).
 */
export default function NowBar() {
  const { pathname } = useLocation();
  const [today, setToday] = useState<Today | null>(null);
  const [reminders, setReminders] = useState(() => readPref() && canNotify() && Notification.permission === "granted");
  const notified = useRef<Set<string>>(new Set());

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

  // Block-start reminders, checked every 20 seconds.
  useEffect(() => {
    if (!reminders || !today) return;
    const t = window.setInterval(() => {
      const now = hhmm(new Date());
      const b = today.blocks.find((x) => x.start === now && (x.category || x.review));
      const key = `${today.date}:${now}`;
      if (!b || notified.current.has(key)) return;
      notified.current.add(key);
      const body = b.review ? "Weekly review: where each goal stands and the next step for each." : `${b.goalTitle || b.label}${b.nextStep ? `\nNext step: ${b.nextStep}` : ""}`;
      try {
        new Notification(`${clock(b.start)}: ${b.category || "Review"}`, { body, tag: key });
      } catch {
        // notifications unavailable
      }
    }, 20000);
    return () => window.clearInterval(t);
  }, [reminders, today]);

  const toggle = async () => {
    if (reminders) {
      setReminders(false);
      savePref(false);
      return;
    }
    if (!canNotify()) return;
    const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    const on = p === "granted";
    setReminders(on);
    savePref(on);
  };

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
            {b.nextStep && <span className="os-small">→ {b.nextStep}</span>}
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
        {f.state === "goal" && b?.goalId && !b.loggedToday && <Link to="/">Done? Check in</Link>}
        {canNotify() && (
          <button type="button" className="os-link" onClick={toggle} title={reminders ? "Turn off block reminders" : "Get a notification when each block starts (while this app is open)"}>
            {reminders ? <FiBell /> : <FiBellOff />} {reminders ? "Reminders on" : "Remind me"}
          </button>
        )}
      </div>
    </div>
  );
}

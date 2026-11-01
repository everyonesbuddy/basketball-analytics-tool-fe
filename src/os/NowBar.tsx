import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiBell, FiBellOff } from "react-icons/fi";
import os from "./api";
import { CategoryTag, ModeBadge } from "./Bits";
import { clock } from "./format";
import type { Block, Today } from "./types";

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
 * The strip at the top of every page: the block you should be in, its goal
 * and mode, and what's next. Refreshes every minute. Optional reminders: a
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
      const body = b.review ? "Weekly goal review: mode, %, ceiling check and next action." : `${b.goalTitle || b.label}${b.modeName ? ` · ${b.modeName}` : ""}${b.reason ? `\n${b.reason}` : ""}`;
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
  const now: Block | null = today.now;
  const next = today.nextGoalBlock;
  const focus = now?.category ? now : null;

  return (
    <div className="os-nowbar no-print">
      <div className="os-nowbar__main">
        <span className="os-kicker">Now</span>
        {focus ? (
          <>
            <CategoryTag category={focus.category!} />
            <strong>{focus.goalTitle || focus.label}</strong>
            <ModeBadge mode={focus.mode} long />
            <span className="os-muted os-small">until {clock(focus.end)}</span>
          </>
        ) : now ? (
          <>
            <strong>{now.label}</strong>
            <span className="os-muted os-small">until {clock(now.end)}</span>
            {now.review && <Link to="/review">Open the review</Link>}
          </>
        ) : (
          <strong>Off schedule</strong>
        )}
        {next && (
          <span className="os-muted os-small os-nowbar__next">
            Next {clock(next.start)}: {next.category} {next.goalTitle || next.label}
          </span>
        )}
      </div>
      <div className="os-nowbar__side">
        {focus && !focus.loggedToday && <Link to="/">Log it</Link>}
        {canNotify() && (
          <button type="button" className="os-link" onClick={toggle} title={reminders ? "Turn off block reminders" : "Get a notification when each block starts (while this app is open)"}>
            {reminders ? <FiBell /> : <FiBellOff />} {reminders ? "Reminders on" : "Remind me"}
          </button>
        )}
      </div>
    </div>
  );
}

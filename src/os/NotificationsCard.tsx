import { useEffect, useState } from "react";
import { FiBell, FiCheck, FiSmartphone } from "react-icons/fi";
import os, { errorText } from "./api";
import { Card, ErrorNote } from "./Bits";
import { canPromptInstall, currentSubscription, disablePush, enablePush, isIOS, isMobile, isStandalone, promptInstall, pushSupported } from "./pwa";
import { useLoad } from "./useLoad";

type Settings = { brief: boolean; blocks: boolean; checkin: boolean; review: boolean; meals: boolean; gifts: boolean; events: boolean; briefTime: string; quietStart: string; quietEnd: string; dailyCap: number };
type Device = { _id: string; label: string; endpoint: string; lastOk: string | null; createdAt: string };

const TYPES: [keyof Settings, string, string][] = [
  ["brief", "Morning brief", "Your first block and its next step, tonight's dinner, anything due today."],
  ["blocks", "Goal block starts", "The goal and its next step, when each goal block starts. Never for breaks."],
  ["checkin", "Check-in at block end", "\"Moved it forward / Cleared it\" (buttons on Android). Skipped if you already checked in."],
  ["review", "Weekly review", "At your weekend slot, and Sunday 6 PM if it's still not done."],
  ["meals", "Meals", "Tonight's planned dinner at 4:30 PM; Sunday 4 PM if next week isn't planned."],
  ["gifts", "Gifting", "Birthdays and anniversaries 7 days, 1 day and on the day; shopping and packing milestones."],
  ["events", "Events", "Saved shows in the next days, and 30 minutes before tickets go on sale."],
];
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const label = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

function InstallHelp() {
  const [, setTick] = useState(0);
  if (isStandalone()) return <p className="os-ok os-flat"><FiCheck /> Installed: you're using the app from your home screen.</p>;
  if (isIOS())
    return (
      <ol className="os-small os-flat">
        <li>Open this site in <strong>Safari</strong> (not Chrome).</li>
        <li>Tap <strong>Share</strong> (the square with the arrow), then <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
        <li>Open <strong>Personal OS</strong> from your home screen and come back here to turn notifications on. (iPhone only allows notifications from the home-screen app, iOS 16.4 or newer.)</li>
      </ol>
    );
  if (canPromptInstall())
    return (
      <button className="os-btn os-btn--primary" onClick={async () => { await promptInstall(); setTick((t) => t + 1); }}>
        <FiSmartphone /> Install the app
      </button>
    );
  return <p className="os-small os-flat">In Chrome, open the menu (⋮) and tap "Install app" or "Add to Home screen". On a computer, use the install icon at the right of the address bar.</p>;
}

/** Install the app, turn push on for this device, and choose which nudges you get. */
export default function NotificationsCard() {
  const { data, error, reload } = useLoad<{ settings: Settings; devices: Device[]; configured: boolean }>(() =>
    Promise.all([os.get("/push/settings"), os.get("/push/devices")]).then(([s, d]) => ({ settings: s.data.settings, devices: d.data.devices, configured: d.data.configured })),
  );
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    currentSubscription().then((s) => setEndpoint(s?.endpoint || null)).catch(() => setEndpoint(null));
  }, []);

  if (error) return <ErrorNote text={error} />;
  if (!data) return null;
  const on = Boolean(endpoint && data.devices.some((d) => d.endpoint === endpoint));
  const s = data.settings;
  const save = async (patch: Partial<Settings>) => {
    await os.put("/push/settings", patch);
    reload();
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(errorText(e, "Something went wrong."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card title="Install on your phone" sub="Personal OS works as an app: its own icon, full screen, and notifications.">
        <InstallHelp />
      </Card>

      <Card
        title={<span className="os-row"><FiBell /> Phone notifications</span>}
        sub="Push notifications for the Personal OS app installed on your phone's home screen (not this website in a browser tab). A few useful nudges a day, never for breaks, quiet at night."
      >
        {!data.configured && <div className="os-error">Phone notifications aren't set up on the server yet: add the VAPID keys to the backend's config vars.</div>}
        {data.configured && !isMobile() && <p className="os-small os-muted os-flat">You're on a computer. Turn these on from the installed app on your phone; the settings below apply to every phone you turn them on for.</p>}
        {data.configured && isMobile() && !isStandalone() && <p className="os-small os-muted os-flat">You're in the browser. Install the app (above) and open it from your home screen to turn these on.</p>}
        <div className="os-row">
          {on ? (
            <>
              <span className="os-tag os-tag--ok"><FiCheck /> On for this phone</span>
              <button className="os-btn" disabled={busy} onClick={() => run(async () => { const r = await os.post("/push/test"); setMsg(`Test sent to ${r.data.ok} of ${r.data.devices} phone${r.data.devices === 1 ? "" : "s"}. It should arrive in a few seconds.`); })}>Send a test</button>
              <button className="os-btn os-btn--ghost" disabled={busy} onClick={() => run(async () => { await disablePush(); setEndpoint(null); reload(); })}>Turn off here</button>
            </>
          ) : (
            <button
              className="os-btn os-btn--primary"
              disabled={busy || !data.configured}
              onClick={() =>
                run(async () => {
                  const r = await enablePush();
                  if (!r.ok) throw new Error(r.message);
                  const sub = await currentSubscription();
                  setEndpoint(sub?.endpoint || null);
                  setMsg("Phone notifications are on. Tap Send a test to check.");
                  reload();
                })
              }
            >
              Turn on notifications on this phone
            </button>
          )}
        </div>
        {!pushSupported() && !on && <p className="os-small os-muted os-flat">{isIOS() && !isStandalone() ? "On iPhone, phone notifications only work from the installed app (see Install above)." : "This browser can't get phone notifications; use the installed app on your phone."}</p>}
        {msg && <p className="os-ok">{msg}</p>}
        {err && <ErrorNote text={err} />}

        <div className="os-notify-types">
          {TYPES.map(([k, name, desc]) => (
            <label key={k} className="os-check os-notify-type">
              <input type="checkbox" checked={Boolean(s[k])} onChange={(e) => save({ [k]: e.target.checked })} />
              <span><strong>{name}</strong><span className="os-small os-muted">{desc}</span></span>
            </label>
          ))}
        </div>
        <div className="os-grid4">
          <label>
            Morning brief at
            <select value={s.briefTime} onChange={(e) => save({ briefTime: e.target.value })}>{TIMES.slice(8, 24).map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
          </label>
          <label>
            Quiet from
            <select value={s.quietStart} onChange={(e) => save({ quietStart: e.target.value })}>{TIMES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
          </label>
          <label>
            Quiet until
            <select value={s.quietEnd} onChange={(e) => save({ quietEnd: e.target.value })}>{TIMES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
          </label>
          <label>
            At most a day
            <select value={s.dailyCap} onChange={(e) => save({ dailyCap: Number(e.target.value) })}>{[4, 6, 8, 12, 16, 20].map((n) => <option key={n} value={n}>{n} notifications</option>)}</select>
          </label>
        </div>

        {data.devices.length > 0 && (
          <details className="os-details">
            <summary>Phones getting notifications ({data.devices.length})</summary>
            <ul className="os-list">
              {data.devices.map((d) => (
                <li key={d._id}>
                  {d.label || "Device"}{d.endpoint === endpoint ? " (this one)" : ""} <span className="os-small os-muted">· added {new Date(d.createdAt).toLocaleDateString()}</span>{" "}
                  <button className="os-link os-small" onClick={() => run(async () => { await os.delete(`/push/devices/${d._id}`); if (d.endpoint === endpoint) { await disablePush(); setEndpoint(null); } reload(); })}>Remove</button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>
    </>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Route, Routes } from "react-router-dom";
import { FiMapPin, FiMusic, FiX } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote, Loading, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import EventRow from "../events/EventRow";
import type { Attraction, EventsOverview, FollowGroup, SavedEvent, SavedStatus, TmEvent } from "../events/types";
import { STATUS_LABEL } from "../events/types";
import { onsaleText } from "../events/util";
import { shortDate, clock } from "../format";
import { findCity } from "../style/weather";
import { useLoad } from "../useLoad";

type Ctx = { data: EventsOverview; reload: () => void; save: (e: TmEvent, status: SavedStatus) => void; savedById: Map<string, SavedEvent> };

function Where({ data, reload }: { data: EventsOverview; reload: () => void }) {
  const [editing, setEditing] = useState(!data.settings.city);
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(data.settings.radius || 50);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = { radius };
      if (name.trim()) {
        const hit = await findCity(name.trim());
        if (!hit) {
          setError("Couldn't find that city. Try the city name on its own.");
          return;
        }
        Object.assign(body, hit);
      }
      await os.put("/events/settings", body);
      setEditing(false);
      reload();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };
  if (!editing) {
    return (
      <p className="os-small os-muted os-flat os-row">
        <FiMapPin /> Within {data.settings.radius} miles of {data.settings.city}
        <button className="os-link" onClick={() => setEditing(true)}>Change</button>
      </p>
    );
  }
  return (
    <form className="os-row" onSubmit={submit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={data.settings.city || "Your city"} required={!data.settings.city} style={{ maxWidth: 240 }} />
      <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: "auto" }}>
        {[10, 25, 50, 100, 200].map((r) => (
          <option key={r} value={r}>within {r} miles</option>
        ))}
      </select>
      <button className="os-btn os-btn--primary" disabled={busy}>{busy ? "Finding…" : "Save"}</button>
      {data.settings.city && <button type="button" className="os-btn" onClick={() => setEditing(false)}>Cancel</button>}
      {error && <span className="os-small os-bad">{error}</span>}
    </form>
  );
}

function FollowSearch({ data, reload }: { data: EventsOverview; reload: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Attraction[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (q.trim().length < 2) return;
    let off = false;
    const t = window.setTimeout(() => {
      os.get("/events/search", { params: { q: q.trim() } })
        .then((r) => !off && (setResults(r.data.results), setError("")))
        .catch((err) => !off && setError(errorText(err, "Search failed.")));
    }, 350);
    return () => {
      off = true;
      window.clearTimeout(t);
    };
  }, [q]);
  const followed = new Set(data.follows.map((f) => f.tmId));
  return (
    <div className="os-form">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Follow an artist, team or show: e.g. Burna Boy, Atlanta Hawks, Hamilton" />
      {error && <ErrorNote text={error} />}
      {q.trim().length >= 2 && results.length > 0 && (
        <div className="os-attractions">
          {results.map((a) => (
            <div key={a.id} className="os-attraction">
              {a.image ? <img src={a.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="os-attraction__ph"><FiMusic /></span>}
              <span>
                <strong>{a.name}</strong>
                <span className="os-small os-muted">{[a.genre || a.segment, a.upcoming !== null ? `${a.upcoming} upcoming` : ""].filter(Boolean).join(" · ")}</span>
              </span>
              {followed.has(a.id) ? (
                <span className="os-tag os-tag--ok">Following</span>
              ) : (
                <button
                  className="os-btn os-btn--small os-btn--primary"
                  onClick={async () => {
                    await os.post("/events/follows", { tmId: a.id, name: a.name, image: a.image, segment: a.segment, genre: a.genre });
                    reload();
                  }}
                >
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {data.follows.length > 0 && (
        <div className="os-row">
          {data.follows.map((f) => (
            <span key={f._id} className="os-chip">
              {f.name}
              <button
                className="os-link"
                title={`Unfollow ${f.name}`}
                onClick={async () => {
                  await os.delete(`/events/follows/${f._id}`);
                  reload();
                }}
              >
                <FiX />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FollowingTab({ data, reload, save, savedById }: Ctx) {
  const key = `${data.follows.map((f) => f.tmId).join(",")}|${data.settings.lat}|${data.settings.radius}`;
  const { data: res, error } = useLoad<{ located: boolean; groups: FollowGroup[] }>(() => os.get("/events/following").then((r) => r.data), key);
  return (
    <div className="os-page">
      <Card title="Who you follow" sub="Their shows near you show first; everywhere else is a tap away.">
        <FollowSearch data={data} reload={reload} />
      </Card>
      {data.follows.length === 0 ? (
        <p className="os-muted">Follow the artists, teams and shows you'd travel for. Their tour dates land here.</p>
      ) : error ? (
        <ErrorNote text={error} />
      ) : !res ? (
        <Loading />
      ) : (
        res.groups.map((g) => (
          <Card key={g.follow._id} title={g.follow.name} sub={g.total === 0 ? "No upcoming events listed." : `${g.near.length} near you · ${g.total} upcoming`}>
            {g.near.map((e) => (
              <EventRow key={e.id} e={e} saved={savedById.get(e.id)} onSave={save} />
            ))}
            {g.near.length === 0 && g.total > 0 && <p className="os-small os-muted os-flat">Nothing within {data.settings.radius} miles{res.located ? "" : " (set your city to see what's near)"}.</p>}
            {g.elsewhere.length > 0 && (
              <details className="os-details">
                <summary>{g.near.length ? "Elsewhere" : "Where they're playing"} ({g.elsewhere.length}{g.total > g.near.length + g.elsewhere.length ? "+" : ""})</summary>
                {g.elsewhere.map((e) => (
                  <EventRow key={e.id} e={e} saved={savedById.get(e.id)} onSave={save} />
                ))}
              </details>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function NearbyTab({ data, save, savedById }: Ctx) {
  const [segment, setSegment] = useState("Music");
  const [days, setDays] = useState(30);
  const located = data.settings.lat !== null;
  const { data: events, error } = useLoad<TmEvent[]>(
    () => (located ? os.get("/events/nearby", { params: { segment: segment || undefined, days } }).then((r) => r.data.events) : Promise.resolve([])),
    `${segment}|${days}|${data.settings.lat}|${data.settings.radius}`,
  );
  if (!located) return <p className="os-muted">Set your city above to see what's on near you.</p>;
  return (
    <div className="os-page">
      <div className="os-row" style={{ justifyContent: "space-between" }}>
        <div className="os-seg">
          {[...data.segments, ""].map((s) => (
            <button key={s || "all"} type="button" className={segment === s ? "on" : ""} onClick={() => setSegment(s)}>{s || "Everything"}</button>
          ))}
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: "auto" }}>
          <option value={7}>Next 7 days</option>
          <option value={30}>Next 30 days</option>
          <option value={90}>Next 3 months</option>
        </select>
      </div>
      {error ? (
        <ErrorNote text={error} />
      ) : !events ? (
        <Loading />
      ) : events.length === 0 ? (
        <p className="os-muted">Nothing listed for that. Try a wider radius or a longer window.</p>
      ) : (
        <Card>
          {events.map((e) => (
            <EventRow key={e.id} e={e} saved={savedById.get(e.id)} onSave={save} />
          ))}
        </Card>
      )}
    </div>
  );
}

function SavedTab({ data, reload }: Ctx) {
  const set = async (s: SavedEvent, status: SavedStatus) => {
    await os.patch(`/events/saved/${s._id}`, { status });
    reload();
  };
  const remove = async (s: SavedEvent) => {
    await os.delete(`/events/saved/${s._id}`);
    reload();
  };
  return (
    <div className="os-page">
      {data.saved.length === 0 && <p className="os-muted">Save events from Following or Near you. Going and on-sale reminders show on Today.</p>}
      {data.saved.length > 0 && (
        <Card>
          {data.saved.map((s) => (
            <div key={s._id} className="os-event">
              <div className="os-event__date">
                <strong>{s.date ? new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { month: "short" }) : "TBA"}</strong>
                <span>{s.date ? Number(s.date.slice(8)) : ""}</span>
              </div>
              <div className="os-event__body">
                <strong>{s.name}</strong>
                <span className="os-small os-muted">
                  {s.date ? shortDate(s.date, true) : "Date TBA"}
                  {s.time ? ` · ${clock(s.time.slice(0, 5))}` : ""} · {[s.venue, s.city].filter(Boolean).join(", ")}
                </span>
                {onsaleText(s.onsaleAt) && <span className="os-small">{onsaleText(s.onsaleAt)}</span>}
              </div>
              <div className="os-event__actions">
                <select value={s.status} onChange={(e) => set(s, e.target.value as SavedStatus)} style={{ width: "auto" }}>
                  {(Object.keys(STATUS_LABEL) as SavedStatus[]).map((k) => (
                    <option key={k} value={k}>{STATUS_LABEL[k]}</option>
                  ))}
                </select>
                {s.url && <a className="os-small" href={s.url} target="_blank" rel="noreferrer">Tickets</a>}
                <button className="os-link os-small" onClick={() => remove(s)}>Remove</button>
              </div>
            </div>
          ))}
        </Card>
      )}
      {data.past.length > 0 && (
        <details className="os-details">
          <summary>Past ({data.past.length})</summary>
          <ul className="os-list">
            {data.past.map((s) => (
              <li key={s._id}>{s.date ? shortDate(s.date) : ""} · {s.name}{s.status === "bought" ? " · went" : ""}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Events & concerts: who you follow and their shows, what's on near you, and what you've saved. */
export default function EventsPage() {
  const { data, error, reload } = useLoad<EventsOverview>(() => os.get("/events").then((r) => r.data));
  const [saveError, setSaveError] = useState("");
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const savedById = new Map(data.saved.map((s) => [s.tmId, s]));
  const save = async (e: TmEvent, status: SavedStatus) => {
    setSaveError("");
    try {
      await os.post("/events/saved", { ...e, status });
      reload();
    } catch (err) {
      setSaveError(errorText(err, "Couldn't save that event."));
    }
  };
  const ctx: Ctx = { data, reload, save, savedById };
  return (
    <div className="os-page">
      <PageHead title="Events & concerts" sub="The artists and teams you follow, what's on near you, and what you're going to." />
      {!data.configured && <div className="os-error">Ticketmaster isn't connected yet: add TICKETMASTER_API_KEY (your Consumer Key) to the backend's config vars and restart.</div>}
      <Where data={data} reload={reload} />
      {data.reminders.length > 0 && (
        <Card>
          <ul className="os-list">
            {data.reminders.map((r, i) => (
              <li key={i}><span className="os-tag os-tag--warn">{r.kind === "onsale" ? "On sale" : "Coming up"}</span> {r.text}</li>
            ))}
          </ul>
        </Card>
      )}
      {saveError && <ErrorNote text={saveError} />}
      <SubNav
        items={[
          ["/events", `Following (${data.follows.length})`, true],
          ["/events/near", "Near you"],
          ["/events/saved", `Saved (${data.saved.length})`],
        ]}
      />
      <Routes>
        <Route index element={<FollowingTab {...ctx} />} />
        <Route path="near" element={<NearbyTab {...ctx} />} />
        <Route path="saved" element={<SavedTab {...ctx} />} />
      </Routes>
    </div>
  );
}

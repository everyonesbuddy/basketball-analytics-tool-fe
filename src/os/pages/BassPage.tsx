import { useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { FiPlay } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import { useLoad } from "../useLoad";
import LessonPlayer from "../bass/LessonPlayer";
import Tuner from "../bass/Tuner";
import Explore from "../bass/Explore";
import { LESSONS, LEVELS, nextLesson } from "../bass/lessons";
import type { BassView } from "../bass/types";

const stars = (n = 0) => "★".repeat(n) + "☆".repeat(3 - n);

function Learn({ view }: { view: BassView | null }) {
  const starsBy = Object.fromEntries(Object.entries(view?.lessons || {}).map(([k, v]) => [k, v.stars]));
  const up = nextLesson(starsBy);
  const done = LESSONS.filter((l) => (starsBy[l.key] || 0) >= 2).length;
  return (
    <div className="os-page">
      <div className="os-grid3">
        <Card title="Up next" sub={`Level ${up.level}: ${LEVELS.find((l) => l.level === up.level)?.name}`} accent="#2563eb">
          <p className="os-flat">
            <strong>{up.title}</strong>
            <br />
            <span className="os-small">{up.concept}</span>
          </p>
          <Link className="os-btn os-btn--primary" to={`/bass/lesson/${up.key}`}>
            <FiPlay /> Start
          </Link>
        </Card>
        <Card title="Practice">
          <p className="os-flat">
            <strong>{view?.streak ?? 0}</strong> day{view?.streak === 1 ? "" : "s"} in a row
            <br />
            <span className="os-small os-muted">
              {view?.todayMinutes ?? 0} min today · {view?.weekMinutes ?? 0} min this week
            </span>
          </p>
          <p className="os-small os-muted os-flat">15 minutes a day beats an hour on Sunday.</p>
        </Card>
        <Card title="Progress">
          <p className="os-flat">
            <strong>
              {done} of {LESSONS.length}
            </strong>{" "}
            lessons with 2+ stars
          </p>
          <p className="os-small os-muted os-flat">Two stars (75%+ in time) moves you on. Three stars is clean.</p>
        </Card>
      </div>
      {LEVELS.map((lv) => (
        <Card key={lv.level} title={`${lv.level}. ${lv.name}`} sub={lv.goal}>
          <ul className="os-list os-lessons">
            {LESSONS.filter((l) => l.level === lv.level).map((l) => {
              const r = view?.lessons[l.key];
              return (
                <li key={l.key}>
                  <Link to={`/bass/lesson/${l.key}`}>{l.title}</Link>
                  <span className="os-small os-muted"> · {l.concept}</span>
                  <span className={`os-stars ${r?.stars ? "on" : ""}`} title={r ? `Best ${r.best}%` : "Not played yet"}>
                    {stars(r?.stars)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function LessonRoute({ view, onSaved }: { view: BassView | null; onSaved: (v: BassView) => void }) {
  const { key } = useParams();
  const lesson = LESSONS.find((l) => l.key === key);
  if (!lesson) return <ErrorNote text="That lesson isn't here." />;
  return <LessonPlayer key={lesson.key} lesson={lesson} view={view} onSaved={onSaved} />;
}

/** Bass: a course from open strings to grooves and songs, with a tuner and the neck to explore. */
export default function BassPage() {
  const { data, error } = useLoad<BassView>(() => os.get("/bass").then((r) => r.data));
  const [saved, setSaved] = useState<BassView | null>(null);
  const view = saved || data;
  const addMinutes = (m: number) => {
    if (m >= 0.5) void os.post("/bass/practice", { minutes: m }).then((r) => setSaved(r.data)).catch(() => {});
  };
  return (
    <div className="os-page">
      <PageHead title="Bass" sub="Learn the 5-string by playing: see it on the neck, hear it, then play it while the app listens." />
      <SubNav
        items={[
          ["/bass", "Lessons", true],
          ["/bass/tuner", "Tuner"],
          ["/bass/neck", "The neck"],
        ]}
      />
      {error && <ErrorNote text={error} />}
      <Routes>
        <Route index element={<Learn view={view} />} />
        <Route path="lesson/:key" element={<LessonRoute view={view} onSaved={setSaved} />} />
        <Route path="tuner" element={<Tuner sensitivity={view?.sensitivity} onMinutes={addMinutes} />} />
        <Route path="neck" element={<Explore />} />
      </Routes>
    </div>
  );
}

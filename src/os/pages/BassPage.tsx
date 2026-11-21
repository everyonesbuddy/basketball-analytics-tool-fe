import { useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { FiCheck, FiPlay, FiZap } from "react-icons/fi";
import os from "../api";
import { Card, ErrorNote, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import { useLoad } from "../useLoad";
import LessonPlayer from "../bass/LessonPlayer";
import Tuner from "../bass/Tuner";
import Explore from "../bass/Explore";
import { LESSONS, LEVELS, nextLesson } from "../bass/lessons";
import type { BassView } from "../bass/types";

function Stars({ n = 0, best }: { n?: number; best?: number }) {
  return (
    <span className={`os-stars ${n ? "on" : ""}`} title={best !== undefined ? `Best ${best}%` : "Not played yet"} aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? "lit" : ""}>
          ★
        </span>
      ))}
    </span>
  );
}

function Learn({ view }: { view: BassView | null }) {
  const starsBy = Object.fromEntries(Object.entries(view?.lessons || {}).map(([k, v]) => [k, v.stars]));
  const up = nextLesson(starsBy);
  const done = LESSONS.filter((l) => (starsBy[l.key] || 0) >= 2).length;
  const pct = Math.round((done / LESSONS.length) * 100);
  const upLevel = LEVELS.find((l) => l.level === up.level);
  const streak = view?.streak ?? 0;
  return (
    <div className="os-page">
      <div className="os-bass-top">
        <div className="os-card os-bass-hero">
          <span className="os-bass-hero__kicker">
            Up next · Level {up.level}: {upLevel?.name}
          </span>
          <h2>{up.title}</h2>
          <p>{up.concept}</p>
          <div className="os-row">
            <Link className="os-btn os-btn--primary" to={`/bass/lesson/${up.key}`}>
              <FiPlay /> {starsBy[up.key] ? "Keep going" : "Start"}
            </Link>
            <Link className="os-btn" to="/bass/tuner">
              Tune up first
            </Link>
          </div>
          <div className="os-progress" aria-label={`${done} of ${LESSONS.length} lessons passed`}>
            <span style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <span className="os-small os-muted">
            {done} of {LESSONS.length} lessons passed. Two stars (75%+ in time) moves you on; three is clean.
          </span>
        </div>
        <div className="os-card os-bass-streak">
          <span className="os-bass-streak__n">
            <FiZap /> {streak}
          </span>
          <strong>day{streak === 1 ? "" : "s"} in a row</strong>
          <span className="os-small os-muted">
            {view?.todayMinutes ?? 0} min today · {view?.weekMinutes ?? 0} min this week
          </span>
          <span className="os-small os-muted">15 minutes a day beats an hour on Sunday.</span>
        </div>
      </div>
      {LEVELS.map((lv) => {
        const inLevel = LESSONS.filter((l) => l.level === lv.level);
        const passed = inLevel.filter((l) => (starsBy[l.key] || 0) >= 2).length;
        return (
          <Card key={lv.level} title={`${lv.level}. ${lv.name}`} sub={lv.goal} right={<span className={`os-tag ${passed === inLevel.length ? "os-tag--ok" : ""}`}>{passed}/{inLevel.length}</span>}>
            <ul className="os-lessons">
              {inLevel.map((l) => {
                const r = view?.lessons[l.key];
                const passedIt = (r?.stars || 0) >= 2;
                const isUp = l.key === up.key;
                return (
                  <li key={l.key}>
                    <Link to={`/bass/lesson/${l.key}`} className={`os-lesson ${isUp ? "up" : ""}`}>
                      <span className={`os-lesson__mark ${passedIt ? "done" : isUp ? "up" : ""}`}>{passedIt ? <FiCheck /> : isUp ? <FiPlay /> : LESSONS.indexOf(l) + 1}</span>
                      <span className="os-lesson__text">
                        <strong>{l.title}</strong>
                        <span>{l.concept}</span>
                      </span>
                      <Stars n={r?.stars} best={r?.best} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
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

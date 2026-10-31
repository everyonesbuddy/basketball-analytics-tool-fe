import { useState } from "react";
import { Link } from "react-router-dom";
import os from "../api";
import { Card, CategoryTag, ErrorNote, Loading, ModeBadge, PageHead, Progress } from "../Bits";
import LogForm from "../LogForm";
import { CATEGORY_COLOR, clock, shortDate } from "../format";
import type { Block, Goal, Today } from "../types";
import { useLoad } from "../useLoad";

const ATTENTION_LABEL: Record<string, string> = {
  missing: "Set a goal",
  early: "Done early",
  "on-time": "Window over",
  rollover: "Roll over",
  ceiling: "Ceiling",
  review: "Weekly review",
};

/** Today: the block you're in, its goal and mode, what needs a decision, and the full day. */
export default function TodayPage() {
  const { data, error, reload } = useLoad<Today>(() => os.get("/today").then((r) => r.data));
  const [logFor, setLogFor] = useState<string | null>(null);

  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const goalById = new Map(data.goals.filter((g) => g.goal).map((g) => [g.goal!._id, g.goal as Goal]));
  const focus = data.now?.category ? data.now : data.nextGoalBlock;

  const logBox = (b: Block, where: string) => {
    const g = b.goalId ? goalById.get(b.goalId) : null;
    if (!g || logFor !== `${where}:${b.start}`) return null;
    return (
      <LogForm
        goal={g}
        mode={b.mode}
        onSaved={() => {
          setLogFor(null);
          reload();
        }}
        onCancel={() => setLogFor(null)}
      />
    );
  };

  return (
    <div className="os-page">
      <PageHead title={shortDate(data.date, true)} sub={`${data.scheduleName} schedule`} />

      {focus && (
        <Card
          accent={focus.category ? CATEGORY_COLOR[focus.category] : undefined}
          title={
            <>
              <span className="os-kicker">{data.now?.category ? "Now" : "Next"} · {clock(focus.start)} to {clock(focus.end)}</span>
              <br />
              {focus.goalTitle || focus.label}
            </>
          }
          right={<ModeBadge mode={focus.mode} long />}
        >
          <p className="os-reason">{focus.reason}</p>
          {focus.goalId && !focus.loggedToday && logFor !== `top:${focus.start}` && (
            <button className="os-btn os-btn--primary" onClick={() => setLogFor(`top:${focus.start}`)}>
              Log this block
            </button>
          )}
          {focus.loggedToday && <p className="os-ok">Logged today.</p>}
          {logBox(focus, "top")}
        </Card>
      )}
      {!focus && data.now && (
        <Card title={<><span className="os-kicker">Now · {clock(data.now.start)} to {clock(data.now.end)}</span><br />{data.now.label}</>}>
          {data.now.review ? <Link to="/review" className="os-btn os-btn--primary">Open the weekly review</Link> : <p className="os-muted">No goal block right now.</p>}
        </Card>
      )}

      {data.attention.length > 0 && (
        <Card title="Needs a decision">
          <ul className="os-list">
            {data.attention.map((a, i) => (
              <li key={i}>
                <span className="os-tag os-tag--warn">{ATTENTION_LABEL[a.kind]}</span> {a.text}{" "}
                {a.kind === "review" ? <Link to="/review">Open review</Link> : <Link to="/goals">Open goals</Link>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Today's blocks">
        <ol className="os-timeline">
          {data.blocks.map((b) => (
            <li key={b.start} className={`${b.now ? "now" : ""} ${b.past ? "past" : ""} ${b.category ? "goal" : ""}`}>
              <span className="os-timeline__time">{clock(b.start)}</span>
              <div className="os-timeline__body">
                <div className="os-row">
                  {b.category && <CategoryTag category={b.category} />}
                  <strong>{b.goalTitle || b.label}</strong>
                  <ModeBadge mode={b.mode} />
                  {b.loggedToday && <span className="os-ok">✓ logged</span>}
                  {b.goalId && !b.loggedToday && logFor !== `day:${b.start}` && (
                    <button className="os-link" onClick={() => setLogFor(`day:${b.start}`)}>
                      Log
                    </button>
                  )}
                </div>
                {b.goalTitle && <div className="os-muted os-small">{b.label}</div>}
                {logBox(b, "day")}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Your six goals">
        <div className="os-goalgrid">
          {data.goals.map((g) => (
            <div key={g.category} className="os-mini" style={{ borderTopColor: CATEGORY_COLOR[g.category] }}>
              <div className="os-row">
                <CategoryTag category={g.category} />
                <ModeBadge mode={g.mode} />
              </div>
              <strong>{g.goal?.title || <span className="os-muted">No goal set</span>}</strong>
              {g.goal && g.window && (
                <Progress
                  value={g.goal.obstacle.kind === "tiered" ? g.goal.percent : ((g.window.totalDays - g.window.daysLeft) / g.window.totalDays) * 100}
                  color={CATEGORY_COLOR[g.category]}
                  label={g.goal.obstacle.kind === "tiered" ? `${g.goal.percent}%` : `${g.window.daysLeft} days left`}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      <blockquote className="os-quote">{data.quote}</blockquote>
    </div>
  );
}

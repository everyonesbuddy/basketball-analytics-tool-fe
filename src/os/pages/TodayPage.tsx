import { useEffect } from "react";
import { Link } from "react-router-dom";
import os from "../api";
import { Card, CategoryTag, ErrorNote, Loading, ModeBadge, PageHead, Progress } from "../Bits";
import NowCard from "../NowCard";
import QuickLog, { CheckedIn } from "../QuickLog";
import { CATEGORY_COLOR, clock, shortDate } from "../format";
import type { Today } from "../types";
import { useLoad } from "../useLoad";

const LONG_DAY: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

const ATTENTION_LABEL: Record<string, string> = {
  missing: "Set a goal",
  early: "Done early",
  "on-time": "Window over",
  rollover: "Roll over",
  ceiling: "Ceiling",
  review: "Weekly review",
  gift: "Gifting",
};

/** Today: what to do now (or what's next and when), what needs a decision, and the full day. */
export default function TodayPage() {
  const { data, error, reload } = useLoad<Today>(() => os.get("/today").then((r) => r.data));
  // Keep "now" current while the page stays open.
  useEffect(() => {
    const t = window.setInterval(reload, 60000);
    return () => window.clearInterval(t);
  }, [reload]);

  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const attention = data.attention.filter((a) => !(a.kind === "review" && data.focus.state === "review"));
  return (
    <div className="os-page">
      <PageHead title={shortDate(data.date, true)} sub={`${data.scheduleName} schedule`} />
      <NowCard focus={data.focus} onChanged={reload} />

      {attention.length > 0 && (
        <Card title="Needs a decision">
          <ul className="os-list">
            {attention.map((a, i) => (
              <li key={i}>
                <span className="os-tag os-tag--warn">{ATTENTION_LABEL[a.kind]}</span> {a.text}{" "}
                {a.kind === "review" ? <Link to="/review">Open review</Link> : a.kind === "gift" ? <Link to="/gifting">Open gifting</Link> : <Link to="/goals">Open goals</Link>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={`Today's schedule (${LONG_DAY[data.weekday] || data.weekday}, ${shortDate(data.date)})`}>
        <ol className="os-timeline">
          {data.blocks.map((b) => (
            <li key={b.start} className={`${b.now ? "now" : ""} ${b.past ? "past" : ""} ${b.category ? "goal" : ""}`}>
              <span className="os-timeline__time">{clock(b.start)}</span>
              <div className="os-timeline__body">
                <div className="os-row">
                  {b.category && <CategoryTag category={b.category} />}
                  <strong>{b.goalTitle || b.label}</strong>
                  <ModeBadge mode={b.mode} />
                  {b.loggedToday && <CheckedIn outcome={b.outcomeToday} />}
                  {b.goalId && !b.loggedToday && (b.past || b.now) && !(b.now && data.focus.state === "goal") && (
                    <QuickLog goalId={b.goalId} nextStep={b.nextStep} block={b.start} links onSaved={reload} />
                  )}
                </div>
                {b.goalTitle && <div className="os-muted os-small">{b.label}{b.nextStep && !b.past ? ` · next step: ${b.nextStep}` : ""}</div>}
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

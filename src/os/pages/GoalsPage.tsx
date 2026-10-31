import { useState } from "react";
import os, { errorText } from "../api";
import { Card, CategoryTag, ErrorNote, Loading, ModeBadge, PageHead, Progress } from "../Bits";
import GoalForm from "../GoalForm";
import LogForm from "../LogForm";
import { CATEGORY_COLOR, MODE_SHORT, shortDate } from "../format";
import type { CategoryInfo, Framework, Goal, GoalLog, Today, TodayGoal } from "../types";
import { useLoad } from "../useLoad";

type Data = { today: Today; framework: Framework; history: Goal[] };

const load = (): Promise<Data> =>
  Promise.all([os.get("/today"), os.get("/framework"), os.get("/goals")]).then(([t, f, g]) => ({
    today: t.data,
    framework: f.data,
    history: (g.data.goals as Goal[]).filter((x) => x.status !== "active"),
  }));

function Logs({ goalId, n }: { goalId: string; n: number }) {
  const { data } = useLoad<GoalLog[]>(() => os.get("/logs", { params: { goal: goalId } }).then((r) => r.data.logs), `${goalId}:${n}`);
  if (!data) return null;
  if (!data.length) return <p className="os-muted os-small">No sessions logged yet.</p>;
  return (
    <ul className="os-loglist">
      {data.slice(0, 8).map((l) => (
        <li key={l._id}>
          <span className="os-muted">{shortDate(l.date, true)}</span> {MODE_SHORT[l.mode].split(" · ")[0]}
          {l.mode === "m2tiered" && ` · +${l.percentGained}%`}
          {l.cleared && " · cleared"}
          {l.toolAcquired && " · got the tool"}
          {l.note && <span className="os-muted"> · {l.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function GoalCard({ info, row, onChanged }: { info: CategoryInfo; row: TodayGoal; onChanged: () => void }) {
  const [view, setView] = useState<"" | "edit" | "log" | "close" | "new">("");
  const [error, setError] = useState("");
  const [n, setN] = useState(0);
  const g = row.goal;
  const done = () => {
    setView("");
    setN((x) => x + 1);
    onChanged();
  };
  const close = async (outcome: "completed" | "expand" | "rollover") => {
    if (!g) return;
    setError("");
    try {
      await os.post(`/goals/${g._id}/close`, { outcome });
      done();
    } catch (err) {
      setError(errorText(err, "Couldn't close it."));
    }
  };

  return (
    <Card
      accent={CATEGORY_COLOR[info.key]}
      title={
        <span className="os-row">
          <CategoryTag category={info.key} /> {info.name}
        </span>
      }
      sub={`${info.about} · ${info.months === 1 ? "1-month" : `${info.months}-month`} window`}
      right={g ? <ModeBadge mode={row.mode} long /> : null}
    >
      {!g && view !== "new" && (
        <div>
          <p className="os-muted">No active goal. One goal per category at a time.</p>
          <button className="os-btn os-btn--primary" onClick={() => setView("new")}>Set a goal</button>
        </div>
      )}
      {!g && view === "new" && <GoalForm category={info.key} info={info} onSaved={done} onCancel={() => setView("")} />}

      {g && view === "edit" && <GoalForm category={info.key} goal={g} onSaved={done} onCancel={() => setView("")} />}
      {g && view !== "edit" && (
        <>
          <h3 className="os-goal-title">{g.title}</h3>
          {g.outcome && <p className="os-small">Done means: {g.outcome}</p>}
          <p className="os-reason">{row.reason}</p>
          <dl className="os-facts">
            <div>
              <dt>Window</dt>
              <dd>
                {shortDate(g.windowStart)} to {shortDate(g.windowEnd)} · {row.window?.ended ? "ended" : `${row.window?.daysLeft} days left`}
              </dd>
            </div>
            <div>
              <dt>Obstacle</dt>
              <dd>
                {g.obstacle.text || "Not described"} ·{" "}
                {g.obstacle.kind === "tiered"
                  ? `tiered${g.obstacle.bounded === true ? ", bounded" : g.obstacle.bounded === false ? ", unbounded" : ""}${g.obstacle.parallel === true ? ", parallel" : g.obstacle.parallel === false ? ", sequential" : ""}`
                  : "single"}
              </dd>
            </div>
            <div>
              <dt>Tool</dt>
              <dd>{g.toolReady ? "In hand" : `Missing: ${g.toolNeeded || "not named yet"}`}</dd>
            </div>
          </dl>
          {g.obstacle.kind === "tiered" && <Progress value={g.percent} color={CATEGORY_COLOR[info.key]} label={`${g.percent}% of the goal`} />}
          {row.window?.next && <div className="os-note">{row.window.next.text}</div>}

          {view === "log" && <LogForm goal={g} mode={row.mode} onSaved={done} onCancel={() => setView("")} />}
          {view === "close" && (
            <div className="os-close">
              <p className="os-small">How did this window end?</p>
              <div className="os-actions">
                <button className="os-btn os-btn--primary" onClick={() => close("completed")}>Completed</button>
                <button className="os-btn" onClick={() => close("expand")} title="Done early: keep going with a wider scope until the window ends">Done early: expand it</button>
                <button className="os-btn" onClick={() => close("rollover")} title="Not done: roll over one full window">Not done: roll over</button>
                <button className="os-btn os-btn--ghost" onClick={() => setView("")}>Cancel</button>
              </div>
            </div>
          )}
          {error && <ErrorNote text={error} />}
          {view === "" && (
            <div className="os-actions">
              <button className="os-btn os-btn--primary" onClick={() => setView("log")}>Log a session</button>
              <button className="os-btn" onClick={() => setView("edit")}>Edit</button>
              <button className="os-btn" onClick={() => setView("close")}>End window</button>
            </div>
          )}
          <details className="os-details">
            <summary>Sessions</summary>
            <Logs goalId={g._id} n={n} />
          </details>
        </>
      )}
    </Card>
  );
}

/** One card per category: its active goal, mode, window and sessions; set, log, edit, end. */
export default function GoalsPage() {
  const { data, error, reload } = useLoad<Data>(load);
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const rows = new Map(data.today.goals.map((g) => [g.category, g]));
  const groups = [...new Set(data.framework.categories.map((c) => c.group))];

  return (
    <div className="os-page">
      <PageHead title="Goals & schedule" sub="One active goal per category. Classify the obstacle, check the tool, and the mode follows." />
      {groups.map((group) => (
        <div key={group} className="os-group">
          <h2 className="os-group__title">{group}</h2>
          <div className="os-grid2">
            {data.framework.categories
              .filter((c) => c.group === group)
              .map((c) => (
                <GoalCard key={c.key} info={c} row={rows.get(c.key)!} onChanged={reload} />
              ))}
          </div>
        </div>
      ))}
      {data.history.length > 0 && (
        <Card title="Past goals">
          <ul className="os-list">
            {data.history.map((g) => (
              <li key={g._id}>
                <CategoryTag category={g.category} /> {g.title} <span className="os-muted">· {g.status === "rolled" ? "rolled over" : g.status} · {shortDate(g.windowStart)} to {shortDate(g.windowEnd)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

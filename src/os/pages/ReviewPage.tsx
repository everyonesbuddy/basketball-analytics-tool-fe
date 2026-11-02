import { useState } from "react";
import os, { errorText } from "../api";
import { Card, CategoryTag, ErrorNote, Loading, ModeBadge, PageHead } from "../Bits";
import { CATEGORY_COLOR, shortDate } from "../format";
import type { ReviewGoal } from "../types";
import { useLoad } from "../useLoad";

type Data = {
  week: { start: string; end: string };
  goals: ReviewGoal[];
  saved: { entries: { goal: string; nextAction: string }[]; notes: string } | null;
};

function ReviewForm({ data, onSaved }: { data: Data; onSaved: () => void }) {
  const [next, setNext] = useState<Record<string, string>>(() => ({
    // Start from each goal's current next step; a saved review's answers win.
    ...Object.fromEntries(data.goals.map((g) => [g.goalId, g.nextStep || ""])),
    ...Object.fromEntries((data.saved?.entries || []).filter((e) => e.nextAction).map((e) => [String(e.goal), e.nextAction])),
  }));
  const [notes, setNotes] = useState(data.saved?.notes || "");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const save = async () => {
    setError("");
    try {
      await os.post("/review", { date: data.week.start, notes, entries: data.goals.map((g) => ({ goal: g.goalId, nextAction: next[g.goalId] || "", mode: g.mode })) });
      setMsg("Review saved.");
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save the review."));
    }
  };

  return (
    <>
      {data.goals.length === 0 && <Card><p className="os-muted">No active goals yet. Set them under Goals & schedule.</p></Card>}
      {data.goals.map((g) => (
        <Card
          key={g.goalId}
          accent={CATEGORY_COLOR[g.category]}
          title={
            <span className="os-row">
              <CategoryTag category={g.category} /> {g.title}
            </span>
          }
          right={<ModeBadge mode={g.mode} long />}
        >
          <dl className="os-facts">
            <div>
              <dt>This week</dt>
              <dd>
                {g.sessions} session{g.sessions === 1 ? "" : "s"}
                {g.mode === "m2tiered" || g.percentThisWeek ? ` · +${g.percentThisWeek}% (now ${g.percentTotal}%)` : ""}
                {g.cleared ? " · obstacle cleared" : ""}
                {g.toolAcquired ? " · got the tool" : ""}
              </dd>
            </div>
            <div>
              <dt>Ceiling check</dt>
              <dd>{g.ceiling.hit ? `Flat: last 3 sessions +${g.ceiling.recent}% vs +${g.ceiling.before}% before. Back to Mode 1.` : (g.ceiling.sessions || 0) < 6 ? "Not enough tiered sessions yet (needs 6)." : "Still climbing."}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>{g.window.ended ? "Ended" : `${g.window.daysLeft} days left`}</dd>
            </div>
          </dl>
          <p className="os-reason">{g.reason}</p>
          {g.window.next && <div className="os-note">{g.window.next.text}</div>}
          <label className="os-form">
            Next step (shows at this goal's next block)
            <input value={next[g.goalId] || ""} onChange={(e) => setNext({ ...next, [g.goalId]: e.target.value })} placeholder="The next concrete step" />
          </label>
        </Card>
      ))}
      <Card title="Notes">
        <textarea className="os-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to adjust: timelines, tools acquired, what worked" />
        {error && <ErrorNote text={error} />}
        {msg && <p className="os-ok">{msg}</p>}
        <div className="os-actions">
          <button className="os-btn os-btn--primary" onClick={save}>Save review</button>
        </div>
      </Card>
    </>
  );
}

/** The weekend review: mode, % this week, ceiling check and next action for each goal. */
export default function ReviewPage() {
  const { data, error, reload } = useLoad<Data>(() => os.get("/review").then((r) => r.data));
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  return (
    <div className="os-page">
      <PageHead title="Weekly review" sub={`Week of ${shortDate(data.week.start)} to ${shortDate(data.week.end)} · Saturday or Sunday, 2:00 to 2:30 PM`} />
      <ReviewForm key={data.week.start + (data.saved ? "s" : "")} data={data} onSaved={reload} />
    </div>
  );
}

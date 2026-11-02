import { Link } from "react-router-dom";
import { CategoryTag } from "./Bits";
import NextStep from "./NextStep";
import QuickLog, { CheckedIn, ModeReminders } from "./QuickLog";
import { CATEGORY_COLOR, clock } from "./format";
import type { Focus } from "./types";
import { whenText } from "./when";

/**
 * The one thing to know: what to work on now (and its next step), or that
 * nothing's on and what's next and when. The check-in is one tap.
 */
export default function NowCard({ focus, onChanged }: { focus: Focus; onChanged: () => void }) {
  const b = focus.block;
  const n = focus.next;
  const isGoal = focus.state === "goal" && b;
  const accent = isGoal && b.category ? CATEGORY_COLOR[b.category] : focus.state === "review" ? "#7c3aed" : "#94a3b8";

  const Next = n ? (
    <div className="os-now__next">
      <span className="os-kicker">Up next · {whenText(n)}</span>
      <div className="os-row">
        {n.category && <CategoryTag category={n.category} />}
        <strong>{n.review ? "Weekly review" : n.goalTitle || `${n.label} (no goal set)`}</strong>
      </div>
      {n.nextStep && <span className="os-small">First step: {n.nextStep}</span>}
    </div>
  ) : null;

  return (
    <section className="os-card os-now" style={{ borderLeft: `5px solid ${accent}` }}>
      {isGoal ? (
        <>
          <span className="os-kicker">Now · until {clock(b.end)}</span>
          <div className="os-row">
            {b.category && <CategoryTag category={b.category} />}
            <h2 className="os-now__title">{b.goalTitle || b.label}</h2>
          </div>
          {b.goalId ? (
            <>
              <NextStep goalId={b.goalId} value={b.nextStep} onSaved={onChanged} />
              {b.loggedToday ? (
                <CheckedIn outcome={b.outcomeToday} logId={b.logIdToday} onUndone={onChanged} />
              ) : (
                <>
                  <ModeReminders mode={b.mode} />
                  <QuickLog goalId={b.goalId} nextStep={b.nextStep} block={b.start} mode={b.mode} reminders={false} simple onSaved={onChanged} />
                </>
              )}
            </>
          ) : (
            <p><Link to="/goals" className="os-btn os-btn--primary">Set a {b.category} goal</Link></p>
          )}
        </>
      ) : focus.state === "review" ? (
        <>
          <span className="os-kicker">{b ? `Now · until ${clock(b.end)}` : "Due"}</span>
          <h2 className="os-now__title">Weekly review</h2>
          <p className="os-now__step">{focus.text}</p>
          <p><Link to="/review" className="os-btn os-btn--primary">Open the review</Link></p>
        </>
      ) : (
        <>
          <span className="os-kicker">Now{focus.until ? ` · until ${clock(focus.until)}` : ""}</span>
          <h2 className="os-now__title">{focus.state === "break" && b ? b.label : focus.state === "free" ? "Nothing scheduled" : "Off schedule"}</h2>
          <p className="os-now__step os-muted">{focus.state === "break" ? "Rest, eat, reset. The next block is below." : focus.text}</p>
        </>
      )}
      {Next}
    </section>
  );
}

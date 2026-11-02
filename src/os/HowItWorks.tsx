import { Link } from "react-router-dom";
import { Card } from "./Bits";

/**
 * What the goals and schedule are, in a few lines, so every page that uses
 * them makes sense on its own. `open` shows it expanded (Goals page);
 * otherwise it's a one-line summary you can expand.
 */
export default function HowItWorks({ open = false }: { open?: boolean }) {
  const body = (
    <div className="os-how">
      <p>
        <strong>Six goals at a time, one per category:</strong> Physical 1 and 2, Professional/Financial 1 and 2, Personal/Creative 1 and 2. Each has a window to finish it in (1 to 6 months, by category).
      </p>
      <p>
        <strong>A block for each goal, every weekday:</strong> one schedule for Monday, Wednesday and Friday, another for Tuesday and Thursday. Weekends are free, with a 30-minute weekly review.
      </p>
      <p>
        <strong>In each block:</strong> work the goal's next step. At the end, tap <em>Moved it forward today</em> or <em>Cleared the goal for this period</em>. The weekly review sets next week's next steps.
      </p>
      <p className="os-small os-muted">
        Full framework and the two schedules: <Link to="/framework">Framework</Link>.
      </p>
    </div>
  );
  if (open) return <Card title="How your goals and schedule work">{body}</Card>;
  return (
    <details className="os-how-box">
      <summary>
        <strong>Your goals and schedule:</strong> 6 goals in 6 categories, a time block for each every weekday, a weekly review on the weekend. <span className="os-link">How it works</span>
      </summary>
      {body}
    </details>
  );
}

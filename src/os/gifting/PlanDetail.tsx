import { useState } from "react";
import os, { errorText } from "../api";
import { Card, ErrorNote, Progress } from "../Bits";
import { shortDate } from "../format";
import { GroupPlanView, HamperView } from "./PlanResult";
import type { GroupResult, HamperResult, Overview, Plan } from "./types";
import { daysTo, usd } from "./util";

/** A saved plan: its checklist (bought, packed), status, and the suggestion it was built from. */
export default function PlanDetail({ plan, data, onChanged, onDeleted }: { plan: Plan; data: Overview; onChanged: () => void; onDeleted: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bought = plan.checklist.filter((c) => c.bought).length;
  const packed = plan.checklist.filter((c) => c.packed).length;
  const days = daysTo(plan.date);
  const person = plan.person ? data.people.find((p) => p._id === plan.person) : null;
  const total = plan.kind === "group" ? (plan.result as GroupResult).totals.total : (plan.result as HamperResult).best.total;

  const patch = async (body: object) => {
    setBusy(true);
    setError("");
    try {
      await os.patch(`/gifting/plans/${plan._id}`, body);
      onChanged();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };

  const given = async () => {
    setBusy(true);
    try {
      if (person) await os.post(`/gifting/people/${person._id}/gifts`, { what: `${(plan.result as HamperResult).best.name} hamper`, cost: total, plan: plan._id });
      await os.patch(`/gifting/plans/${plan._id}`, { status: "done" });
      onChanged();
    } catch (err) {
      setError(errorText(err, "Couldn't save."));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${plan.title}"?`)) return;
    await os.delete(`/gifting/plans/${plan._id}`);
    onDeleted();
  };

  return (
    <div className="os-page">
      <Card
        title={plan.title}
        sub={`${plan.kind === "group" ? "Group" : person ? `For ${person.name}` : "One person"} · ${usd(total)}${plan.date ? ` · ${shortDate(plan.date.slice(0, 10))}${days !== null && days >= 0 ? `, ${days} days to go` : ""}` : ""}`}
        right={<span className={`os-tag ${plan.status === "done" ? "os-tag--ok" : "os-tag--warn"}`}>{plan.status === "done" ? "Done" : plan.status === "shopping" ? "Shopping" : "Planning"}</span>}
      >
        <div className="os-grid2">
          <Progress value={plan.checklist.length ? (bought / plan.checklist.length) * 100 : 0} color="#2563eb" label={`${bought} of ${plan.checklist.length} bought`} />
          <Progress value={plan.checklist.length ? (packed / plan.checklist.length) * 100 : 0} color="#16a34a" label={`${packed} of ${plan.checklist.length} packed`} />
        </div>
        <table className="os-table os-table--wide os-checklist">
          <thead>
            <tr><th>Item</th><th>Where</th><th className="os-num">Bought</th><th className="os-num">Packed</th></tr>
          </thead>
          <tbody>
            {plan.checklist.map((c) => (
              <tr key={c.key} className={c.packed ? "done" : ""}>
                <td>{c.name}{c.packs > 1 ? ` × ${c.packs}` : ""}</td>
                <td className="os-muted">{c.store}</td>
                <td className="os-num"><input type="checkbox" checked={c.bought} disabled={busy} onChange={(e) => patch({ checklist: [{ key: c.key, bought: e.target.checked }], ...(plan.status === "planning" && e.target.checked ? { status: "shopping" } : {}) })} aria-label={`${c.name} bought`} /></td>
                <td className="os-num"><input type="checkbox" checked={c.packed} disabled={busy} onChange={(e) => patch({ checklist: [{ key: c.key, packed: e.target.checked }] })} aria-label={`${c.name} packed`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <ErrorNote text={error} />}
        <div className="os-actions">
          {plan.status !== "done" && plan.kind === "one" && <button className="os-btn os-btn--primary" disabled={busy} onClick={given}>{person ? `Given: log it for ${person.name}` : "Mark given"}</button>}
          {plan.status !== "done" && plan.kind === "group" && <button className="os-btn os-btn--primary" disabled={busy} onClick={() => patch({ status: "done" })}>Mark done</button>}
          {plan.status === "done" && <button className="os-btn" disabled={busy} onClick={() => patch({ status: "shopping" })}>Reopen</button>}
          <button className="os-btn os-btn--ghost" onClick={remove}>Delete plan</button>
        </div>
      </Card>
      {plan.kind === "group" ? <GroupPlanView r={plan.result as GroupResult} /> : <HamperView r={plan.result as HamperResult} />}
    </div>
  );
}

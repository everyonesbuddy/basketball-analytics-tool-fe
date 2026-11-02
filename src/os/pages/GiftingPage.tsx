import { useState } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import os from "../api";
import { Card, ErrorNote, Loading, PageHead, Progress } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import IdeasTab from "../gifting/IdeasTab";
import PeopleTab from "../gifting/PeopleTab";
import PlanDetail from "../gifting/PlanDetail";
import PlanForm from "../gifting/PlanForm";
import type { GroupResult, HamperResult, Overview, Plan, Reminder } from "../gifting/types";
import { daysTo, usd } from "../gifting/util";
import { shortDate } from "../format";
import { useLoad } from "../useLoad";

const REMINDER_TAG: Record<Reminder["kind"], string> = { date: "Coming up", overdue: "It's been a while", shop: "Shop", pack: "Pack", nudge: "Gift someone" };

function PlanCard({ p, data }: { p: Plan; data: Overview }) {
  const bought = p.checklist.filter((c) => c.bought).length;
  const total = p.kind === "group" ? (p.result as GroupResult).totals?.total : (p.result as HamperResult).best?.total;
  const days = daysTo(p.date);
  const person = p.person ? data.people.find((x) => x._id === p.person) : null;
  return (
    <Link to={`/gifting/plan/${p._id}`} className="os-card os-plancard">
      <strong>{p.title}</strong>
      <span className="os-small os-muted">
        {p.kind === "group" ? `${(p.result as GroupResult).people} people` : person ? `For ${person.name}` : "One person"} · {usd(total)}
        {p.date ? ` · ${shortDate(p.date.slice(0, 10))}${days !== null && days >= 0 ? ` (${days} days)` : ""}` : ""}
      </span>
      <Progress value={p.checklist.length ? (bought / p.checklist.length) * 100 : 0} color="#db2777" label={`${bought}/${p.checklist.length} bought`} />
    </Link>
  );
}

function ComingUp({ data }: { data: Overview }) {
  const active = data.plans.filter((p) => p.status !== "done");
  const done = data.plans.filter((p) => p.status === "done");
  return (
    <div className="os-page">
      <Card title="Who to gift soon">
        {data.reminders.length === 0 ? (
          <p className="os-muted">{data.people.length ? "Nothing due. Add birthdays to get reminders." : "Add the people you give to (People tab) to get reminders for birthdays, anniversaries and the ones you haven't gifted in a while."}</p>
        ) : (
          <ul className="os-list">
            {data.reminders.map((r, i) => (
              <li key={i}>
                <span className="os-tag os-tag--warn">{REMINDER_TAG[r.kind]}</span> {r.text}{" "}
                {r.planId ? <Link to={`/gifting/plan/${r.planId}`}>Open plan</Link> : r.personId ? <Link to={`/gifting/new?person=${r.personId}`}>Plan a gift</Link> : <Link to="/gifting/new">Plan a gift</Link>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="os-row" style={{ justifyContent: "space-between" }}>
        <h2 className="os-group__title">Plans</h2>
        <Link to="/gifting/new" className="os-btn os-btn--primary">Plan a gift</Link>
      </div>
      {active.length === 0 && <p className="os-muted">No plans yet. Plan a group (like December back home) or one person's hamper.</p>}
      <div className="os-grid3">
        {active.map((p) => (
          <PlanCard key={p._id} p={p} data={data} />
        ))}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="os-group__title">Done</h2>
          <div className="os-grid3">
            {done.map((p) => (
              <PlanCard key={p._id} p={p} data={data} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlanRoute({ data, reload }: { data: Overview; reload: () => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = data.plans.find((p) => p._id === id);
  if (!plan) return <ErrorNote text="That plan isn't here anymore." />;
  return (
    <PlanDetail
      plan={plan}
      data={data}
      onChanged={reload}
      onDeleted={() => {
        reload();
        navigate("/gifting");
      }}
    />
  );
}

function NewPlanRoute({ data, reload }: { data: Overview; reload: () => void }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const person = params.get("person") || undefined;
  return (
    <PlanForm
      key={person || "new"}
      data={data}
      personId={person}
      onSaved={(id) => {
        reload();
        navigate(`/gifting/plan/${id}`);
      }}
      onCancel={() => navigate(-1)}
    />
  );
}

/** Gifting: who to gift soon, plans (a group or one person), the people, and saved ideas. */
export default function GiftingPage() {
  const { data, error, reload } = useLoad<Overview>(() => os.get("/gifting").then((r) => r.data));
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const refresh = () => {
    reload();
    setTick((t) => t + 1);
  };
  return (
    <div className="os-page">
      <PageHead title="Gifting" sub="Who to gift soon, what to give, and how to package it, on budget." />
      <SubNav
        items={[
          ["/gifting", "Coming up", true],
          ["/gifting/new", "Plan a gift"],
          ["/gifting/people", `People (${data.people.length})`],
          ["/gifting/ideas", `Ideas (${data.ideas.length})`],
        ]}
      />
      <Routes>
        <Route index element={<ComingUp data={data} />} />
        <Route path="new" element={<NewPlanRoute data={data} reload={refresh} />} />
        <Route path="plan/:id" element={<PlanRoute data={data} reload={refresh} />} />
        <Route path="people" element={<PeopleTab data={data} onChanged={refresh} onPlan={(id) => navigate(`/gifting/new?person=${id}`)} />} />
        <Route path="ideas" element={<IdeasTab data={data} onChanged={refresh} />} />
      </Routes>
    </div>
  );
}

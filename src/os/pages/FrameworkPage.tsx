import os from "../api";
import { Card, CategoryTag, ErrorNote, Loading, PageHead } from "../Bits";
import { clock } from "../format";
import type { Framework, Mode } from "../types";
import { useLoad } from "../useLoad";

/** The cheat sheet: framework, modes, categories, both schedules and the quotes. Printable. */
export default function FrameworkPage() {
  const { data, error } = useLoad<Framework>(() => os.get("/framework").then((r) => r.data));
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const f = data.framework;
  return (
    <div className="os-page">
      <PageHead
        title="Framework"
        sub="Goals, obstacles and causation, and the schedule that runs them."
        right={
          <button className="os-btn no-print" onClick={() => window.print()}>
            Print
          </button>
        }
      />
      <Card title="Cause and effect">
        <p>{f.intro}</p>
        <dl className="os-facts">
          {f.terms.map((t) => (
            <div key={t.term}>
              <dt>{t.term}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className="os-grid2">
        <Card title="A goal must be">
          <ul>{f.goalStandard.map((x) => <li key={x}>{x}</li>)}</ul>
        </Card>
        <Card title="Classify the obstacle">
          <ol>{f.classify.map((x) => <li key={x}>{x}</li>)}</ol>
        </Card>
      </div>
      <Card title="The three modes">
        <dl className="os-facts">
          {(Object.keys(data.modes) as Mode[]).map((m) => (
            <div key={m}>
              <dt>{data.modes[m].name}</dt>
              <dd>{data.modes[m].what}</dd>
            </div>
          ))}
        </dl>
        <p className="os-small">Each day, for each goal: Do I have the tool? No → Mode 1. Yes → single obstacle → Mode 2-Single; tiered → Mode 2-Tiered, unless the % has gone flat (ceiling) → back to Mode 1.</p>
      </Card>
      <div className="os-grid2">
        <Card title="Categories and windows">
          <ul className="os-list">
            {data.categories.map((c) => (
              <li key={c.key}>
                <CategoryTag category={c.key} /> {c.name} · {c.months} month{c.months > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="When a window ends">
          <dl className="os-facts">
            {f.windowEnd.map((w) => (
              <div key={w.when}>
                <dt>{w.when}</dt>
                <dd>{w.then}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
      <div className="os-grid3">
        {(["v1", "v2", "weekend"] as const).map((k) => (
          <Card key={k} title={data.schedules[k].name}>
            <table className="os-table">
              <tbody>
                {data.schedules[k].blocks.map((b) => (
                  <tr key={b.start}>
                    <td className="os-muted">{clock(b.start)}</td>
                    <td>{b.goal ? <CategoryTag category={b.goal} /> : null} {b.label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
      <Card title="Focus">
        <p>{f.focus}</p>
      </Card>
      <Card title="Principles">
        <ul>{f.principles.map((x) => <li key={x}>{x}</li>)}</ul>
      </Card>
      {data.quotes.map((q) => (
        <blockquote key={q} className="os-quote">{q}</blockquote>
      ))}
    </div>
  );
}

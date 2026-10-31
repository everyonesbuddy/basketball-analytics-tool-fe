import { Card, PageHead } from "../Bits";

/** A widget that's planned but not built yet, with what it will do. */
export default function SoonPage({ title, what, inputs }: { title: string; what: string[]; inputs: string }) {
  return (
    <div className="os-page">
      <PageHead title={title} sub="Coming in a later update." />
      <Card title="What it will do">
        <ul>{what.map((w) => <li key={w}>{w}</li>)}</ul>
        <p className="os-small os-muted">What you'll enter: {inputs}</p>
      </Card>
    </div>
  );
}

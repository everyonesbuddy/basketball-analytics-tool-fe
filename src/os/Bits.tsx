import type { ReactNode } from "react";
import { CATEGORY_COLOR } from "./format";
import type { Category } from "./types";

export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="os-tag" style={{ color: CATEGORY_COLOR[category], background: `${CATEGORY_COLOR[category]}14` }}>
      {category}
    </span>
  );
}

export function Card({ title, sub, children, right, accent }: { title?: ReactNode; sub?: ReactNode; children?: ReactNode; right?: ReactNode; accent?: string }) {
  return (
    <section className="os-card" style={accent ? { borderLeft: `4px solid ${accent}` } : undefined}>
      {(title || right) && (
        <div className="os-card__head">
          <div>
            {title && <h2 className="os-card__title">{title}</h2>}
            {sub && <p className="os-card__sub">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Progress({ value, color = "#2563eb", label }: { value: number; color?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="os-progress">
      <div className="os-progress__track">
        <div className="os-progress__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {label && <span className="os-progress__label">{label}</span>}
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="os-pagehead">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  );
}

export function Loading() {
  return <p className="os-muted">Loading…</p>;
}

export function ErrorNote({ text }: { text: string }) {
  return <div className="os-error">{text}</div>;
}

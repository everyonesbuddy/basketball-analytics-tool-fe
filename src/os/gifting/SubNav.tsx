import { NavLink } from "react-router-dom";

/** Tabs that are links, so each part has its own address. */
export function SubNav({ items }: { items: [string, string, boolean?][] }) {
  return (
    <nav className="os-subnav">
      {items.map(([to, label, end]) => (
        <NavLink key={to} to={to} end={Boolean(end)} className={({ isActive }) => (isActive ? "active" : "")}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

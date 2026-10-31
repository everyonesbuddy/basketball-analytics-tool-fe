import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { FiActivity, FiBookOpen, FiCalendar, FiCheckSquare, FiDollarSign, FiGift, FiMusic, FiNavigation, FiSettings, FiSun, FiTarget } from "react-icons/fi";
import type { ReactNode } from "react";
import os, { SIGNED_OUT, getToken } from "./api";
import Dashboard from "../components/Dashboard";
import TodayPage from "./pages/TodayPage";
import GoalsPage from "./pages/GoalsPage";
import ReviewPage from "./pages/ReviewPage";
import FrameworkPage from "./pages/FrameworkPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import SoonPage from "./pages/SoonPage";
import "./os.css";

type Item = { to: string; label: string; icon: ReactNode; soon?: boolean };
const NAV: { title: string; items: Item[] }[] = [
  { title: "", items: [{ to: "/", label: "Today", icon: <FiSun /> }] },
  {
    title: "Planning & execution",
    items: [
      { to: "/goals", label: "Goals & schedule", icon: <FiTarget /> },
      { to: "/review", label: "Weekly review", icon: <FiCheckSquare /> },
      { to: "/framework", label: "Framework", icon: <FiBookOpen /> },
      { to: "/travel", label: "Travel", icon: <FiNavigation />, soon: true },
    ],
  },
  {
    title: "Creative & curation",
    items: [
      { to: "/gifting", label: "Gifting", icon: <FiGift />, soon: true },
      { to: "/style", label: "Style", icon: <FiCalendar />, soon: true },
    ],
  },
  {
    title: "Entertainment",
    items: [
      { to: "/events", label: "Events & concerts", icon: <FiMusic />, soon: true },
      { to: "/sports", label: "Sports", icon: <FiActivity /> },
    ],
  },
  { title: "Money", items: [{ to: "/money", label: "Money", icon: <FiDollarSign />, soon: true }] },
  { title: "", items: [{ to: "/settings", label: "Settings", icon: <FiSettings /> }] },
];

const SOON: Record<string, { title: string; what: string[]; inputs: string }> = {
  gifting: {
    title: "Gifting",
    what: ["People you give to, with relationship, sizes and a gift level", "Trips and occasions (like December in Nigeria) with a budget and suitcase space", "Gift packages by level, a shopping list with quantities and costs, and money left", "One packaging theme and an assembly checklist"],
    inputs: "the trip's budget and people once, then tick things off",
  },
  style: {
    title: "Style",
    what: ["Your style guide as rules: color structure, silhouette, occasion", "A daily outfit from your wardrobe that fits the rules and today's weather"],
    inputs: "your wardrobe once, then the occasion",
  },
  events: {
    title: "Events & concerts",
    what: ["Artists and teams you follow", "Upcoming shows near you from Ticketmaster's free API"],
    inputs: "who you follow and your city, once",
  },
  travel: {
    title: "Travel",
    what: ["Places you want to go, with the best months and typical fares", "When to book, with ready-made Google Flights searches"],
    inputs: "a place and rough dates",
  },
  money: {
    title: "Money",
    what: ["Accounts and assets (car, business) for net worth and its trend", "Savings goals, like a trip budget"],
    inputs: "a few balances once a month",
  },
};

function Shell({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="os-shell">
      <nav className="os-nav no-print" aria-label="Widgets">
        <Link to="/" className="os-nav__brand">Personal OS</Link>
        {NAV.map((g, i) => (
          <div key={i} className="os-nav__group">
            {g.title && <p className="os-nav__title">{g.title}</p>}
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.to === "/"} className={({ isActive }) => `os-nav__link ${isActive ? "active" : ""} ${it.soon ? "soon" : ""}`}>
                {it.icon}
                <span>{it.label}</span>
                {it.soon && <em>soon</em>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <main className="os-main">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/framework" element={<FrameworkPage />} />
          <Route path="/settings" element={<SettingsPage email={email} onSignOut={onSignOut} />} />
          {Object.entries(SOON).map(([k, v]) => (
            <Route key={k} path={`/${k}`} element={<SoonPage {...v} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

/** Start each page at the top. */
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Sports keeps its own full-width layout (it has its own sidebar). */
function SportsPage() {
  return (
    <>
      <div className="os-backbar no-print">
        <Link to="/">← Personal OS</Link>
        <span>Sports</span>
      </div>
      <Dashboard />
    </>
  );
}

export default function OsApp() {
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    let off = false;
    const check = getToken() ? os.get("/auth/me").then((r) => r.data.user.email as string) : Promise.reject(new Error("no token"));
    check
      .then((e) => !off && setEmail(e))
      .catch(() => !off && setEmail(null))
      .finally(() => !off && setChecked(true));
    const out = () => setEmail(null);
    window.addEventListener(SIGNED_OUT, out);
    return () => {
      off = true;
      window.removeEventListener(SIGNED_OUT, out);
    };
  }, [n]);

  if (!checked) return <p className="os-muted os-pad">Loading…</p>;
  if (!email) return <LoginPage onSignedIn={() => setN((x) => x + 1)} />;
  return (
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        <Route path="/sports" element={<SportsPage />} />
        <Route path="/*" element={<Shell email={email} onSignOut={() => setEmail(null)} />} />
      </Routes>
    </BrowserRouter>
  );
}

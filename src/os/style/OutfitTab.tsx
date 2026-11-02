import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { FiCheck, FiCloudRain, FiMapPin } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { Pics } from "../Pics";
import type { Outfit, StyleOverview, Suggestion } from "./types";
import { SLOT_LABEL, TRAD_LABEL } from "./types";
import { findCity, todayWeather } from "./weather";
import type { Weather } from "./weather";

// When there's no forecast (or you want to override it).
const MANUAL: Record<string, { label: string; w: { tempF: number; rain: boolean } | null }> = {
  forecast: { label: "Use the forecast", w: null },
  cold: { label: "Cold", w: { tempF: 45, rain: false } },
  cool: { label: "Cool", w: { tempF: 58, rain: false } },
  mild: { label: "Mild", w: { tempF: 70, rain: false } },
  hot: { label: "Hot", w: { tempF: 86, rain: false } },
  rain: { label: "Rain", w: { tempF: 60, rain: true } },
};

export function Swatch({ hex, title }: { hex: string; title?: string }) {
  return <span className="os-swatch" style={{ background: hex }} title={title} />;
}

function CityForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const hit = await findCity(name.trim());
      if (!hit) {
        setError("Couldn't find that city. Try the city name on its own.");
        return;
      }
      await os.put("/style/profile", hit);
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't look that up."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="os-row" onSubmit={submit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your city, for the weather" required style={{ maxWidth: 260 }} />
      <button className="os-btn" type="submit" disabled={busy}>{busy ? "Finding…" : "Save city"}</button>
      {error && <span className="os-small os-bad">{error}</span>}
    </form>
  );
}

function OutfitCard({ o, occasion, worn, onWorn, onShop, best, trad = false }: { o: Outfit; occasion: string; worn: boolean; onWorn: () => void; onShop: (slot: string, color: string) => void; best: boolean; trad?: boolean }) {
  const label = trad ? TRAD_LABEL : SLOT_LABEL;
  const [busy, setBusy] = useState(false);
  const wear = async () => {
    setBusy(true);
    try {
      await os.post("/style/worn", { lookKey: o.key, occasion, name: o.name, items: o.pieces.map((p) => p.item?._id).filter(Boolean) });
      onWorn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title={o.name} sub={`${o.structureName} · ${o.owned}/${o.total} in your wardrobe`} accent={best ? "#0f766e" : undefined}>
      <div className="os-outfit__line">
        {o.pieces.map((p) => (
          <span key={p.slot} className="os-outfit__band" style={{ background: p.hex, opacity: p.optional ? 0.5 : 1 }} title={`${label[p.slot]}: ${p.colorName}`} />
        ))}
      </div>
      <ul className="os-outfit">
        {o.pieces.map((p) => (
          <li key={p.slot}>
            <Swatch hex={p.hex} title={p.colorName} />
            <span className="os-outfit__slot">{label[p.slot]}{p.optional ? " (optional)" : ""}</span>
            <span className="os-outfit__what">
              {p.item ? (
                <strong>{p.item.name}</strong>
              ) : (
                <>
                  {p.desc} <span className="os-muted os-small">· not in your wardrobe</span>{" "}
                  <button type="button" className="os-link os-small" onClick={() => onShop(p.slot, p.color)}>shop it</button>
                </>
              )}{" "}
              {p.missing && <Pics q={`men ${p.desc.toLowerCase().includes(p.colorName.toLowerCase()) ? "" : `${p.colorName.toLowerCase()} `}${p.desc.toLowerCase()}`} />}
            </span>
          </li>
        ))}
      </ul>
      <ul className="os-small os-notes">
        {o.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <details className="os-small">
        <summary>Why this works</summary>
        <p className="os-flat">{o.why}</p>
      </details>
      <div className="os-actions">
        {worn ? (
          <span className="os-tag os-tag--ok"><FiCheck /> Wearing this today</span>
        ) : (
          <button className="os-btn os-btn--primary" onClick={wear} disabled={busy}>Wear this</button>
        )}
        <Pics q={o.search} label="See the look" />
      </div>
    </Card>
  );
}

/** Today's outfit: pick the occasion, the weather sets the layer, the wardrobe fills the pieces. */
export default function OutfitTab({ data, onChanged, onShop }: { data: StyleOverview; onChanged: () => void; onShop: (slot: string, color: string) => void }) {
  const [occasion, setOccasion] = useState("everyday");
  const [manual, setManual] = useState("forecast");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [result, setResult] = useState<Suggestion | null>(null);
  const [error, setError] = useState("");
  const [n, setN] = useState(0);
  const { lat, lon } = data.profile;

  useEffect(() => {
    if (lat === null || lon === null) return;
    let off = false;
    todayWeather(lat, lon)
      .then((w) => !off && setWeather(w))
      .catch(() => !off && setWeatherError("Couldn't get the forecast. Pick the weather instead."));
    return () => {
      off = true;
    };
  }, [lat, lon]);

  const w = manual === "forecast" ? (weather ? { tempF: weather.tempF, rain: weather.rain } : null) : MANUAL[manual].w;
  const key = JSON.stringify([occasion, w, n, data.wardrobe.length]);
  useEffect(() => {
    let off = false;
    const [occ, wx] = JSON.parse(key);
    os.post("/style/suggest", { occasion: occ, weather: wx })
      .then((r) => {
        if (off) return;
        setResult(r.data);
        setError("");
      })
      .catch((err) => !off && setError(errorText(err, "Couldn't suggest outfits.")));
    return () => {
      off = true;
    };
  }, [key]);

  const occasions = Object.entries(data.guide.occasions);
  const wornKeys = new Set((result?.wornToday || []).map((x) => x.lookKey));

  return (
    <div className="os-page">
      <Card>
        <div className="os-form">
          <div>
            <p className="os-label">Where are you going?</p>
            <div className="os-seg">
              {occasions.map(([k, o]) => (
                <button key={k} type="button" className={occasion === k ? "on" : ""} onClick={() => setOccasion(k)}>{o.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="os-label">
              {data.profile.city ? (
                <>
                  <FiMapPin /> {data.profile.city}
                  {weather && manual === "forecast" && <span className="os-muted"> · {weather.label}</span>}
                  {weather?.rain && manual === "forecast" && <FiCloudRain style={{ marginLeft: 6 }} />}
                </>
              ) : (
                "Weather"
              )}
            </p>
            {data.profile.city ? null : <CityForm onSaved={onChanged} />}
            {weatherError && <p className="os-small os-muted os-flat">{weatherError}</p>}
            <div className="os-seg" style={{ marginTop: 6 }}>
              {Object.entries(MANUAL)
                .filter(([k]) => k !== "forecast" || data.profile.city)
                .map(([k, m]) => (
                  <button key={k} type="button" className={manual === k ? "on" : ""} onClick={() => setManual(k)}>{m.label}</button>
                ))}
            </div>
          </div>
        </div>
      </Card>
      {error && <ErrorNote text={error} />}
      {result && (
        <>
          <p className="os-small os-muted os-flat">
            {result.occasionName}: {result.layer.why} Shoes: {result.shoe}.
            {data.wardrobe.length === 0 && " Add what you own in Wardrobe and these fill in with your actual pieces."}
          </p>
          <div className="os-grid3">
            {result.outfits.map((o, i) => (
              <OutfitCard key={o.key} o={o} occasion={result.occasion} trad={result.trad} best={i === 0} worn={wornKeys.has(o.key)} onWorn={() => setN((x) => x + 1)} onShop={onShop} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

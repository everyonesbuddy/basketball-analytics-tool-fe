import { useState } from "react";
import type { FormEvent } from "react";
import { FiExternalLink, FiShoppingBag } from "react-icons/fi";
import os, { errorText } from "../api";
import { Card, ErrorNote } from "../Bits";
import { Pics } from "../Pics";
import type { CorePiece, Slot, StyleOverview } from "./types";
import { SLOTS, SLOT_LABEL } from "./types";
import { Swatch } from "./OutfitTab";

const PRIORITY = { 1: "Foundation", 2: "Next", 3: "Later" } as const;
const usd = (n: number | null) => (n === null ? "" : `$${n.toFixed(2)}`);

function SaveLink({ core, onSaved, onCancel }: { core?: CorePiece; onSaved: () => void; onCancel?: () => void }) {
  const [url, setUrl] = useState("");
  const [slot, setSlot] = useState<Slot | "">(core?.slot || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await os.post("/style/shop", { url: url.trim(), core: core?.key || null, slot: slot || null, color: core?.color || null });
      setUrl("");
      setMsg(res.data.blocked || !res.data.item.image ? "Saved. That store didn't share its picture or price." : "Saved.");
      onSaved();
    } catch (err) {
      setError(errorText(err, "Couldn't save that link."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="os-form os-form--inline" onSubmit={submit}>
      <div className="os-row">
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a product link" required style={{ flex: 1, minWidth: 220 }} autoFocus={Boolean(core)} />
        {!core && (
          <select value={slot} onChange={(e) => setSlot(e.target.value as Slot | "")} style={{ width: "auto" }}>
            <option value="">Kind of piece</option>
            {SLOTS.map((s) => <option key={s} value={s}>{SLOT_LABEL[s]}</option>)}
          </select>
        )}
        <button className="os-btn os-btn--primary" type="submit" disabled={busy}>{busy ? "Reading the page…" : "Save"}</button>
        {onCancel && <button className="os-btn" type="button" onClick={onCancel}>Cancel</button>}
      </div>
      {error && <ErrorNote text={error} />}
      {msg && <p className="os-ok">{msg}</p>}
    </form>
  );
}

/**
 * Shopping: the core pieces the guide calls for that you don't own yet (what
 * to look for, pictures, "I have it"), and the product links you've saved.
 */
export default function ShopTab({ data, onChanged, focus }: { data: StyleOverview; onChanged: () => void; focus?: { slot: string; color: string } }) {
  const [open, setOpen] = useState<string>("");
  const [showOwned, setShowOwned] = useState(false);
  const colors = data.guide.colors;
  const g = data.gaps;
  const linksFor = (key: string) => data.shop.filter((s) => s.core === key && s.status === "want").length;
  const focused = focus ? g.items.find((i) => !i.owned && i.slot === focus.slot && i.color === focus.color) : undefined;

  const have = async (c: CorePiece) => {
    await os.post("/style/wardrobe", { slot: c.slot, color: c.color, name: c.name.replace(/ \(.*\)$/, "").replace(/, .*$/, "") });
    onChanged();
  };

  const rows = g.items.filter((i) => showOwned || !i.owned);
  const want = data.shop.filter((s) => s.status === "want");
  const bought = data.shop.filter((s) => s.status === "bought");

  return (
    <div className="os-page">
      <div className="os-stats">
        <div><span>Core pieces</span><strong>{g.owned}/{g.items.length}</strong><small>owned</small></div>
        <div><span>Still to get</span><strong>{g.missing}</strong></div>
        <div><span>Saved links</span><strong>{want.length}</strong></div>
      </div>
      {focus && !focused && <p className="os-small os-muted os-flat">That piece isn't one of the core pieces; save a link for it below.</p>}
      {g.next.length > 0 && (
        <Card title="Buy next" sub={`${PRIORITY[g.next[0].priority]} pieces: everything else builds on these.`} accent="#0f766e">
          <div className="os-grid3">
            {(focused ? [focused, ...g.next.filter((n) => n.key !== focused.key)].slice(0, 3) : g.next).map((c) => (
              <div key={c.key} className="os-service">
                <span className="os-row"><Swatch hex={colors[c.color].hex} /> <strong>{c.name}</strong></span>
                <span className="os-small">{c.look}</span>
                <span className="os-row os-small">
                  <Pics q={c.search} />
                  <button className="os-link" onClick={() => setOpen(c.key)}>Save a link</button>
                  <button className="os-link" onClick={() => have(c)}>I have it</button>
                </span>
                {open === c.key && <SaveLink core={c} onSaved={() => { setOpen(""); onChanged(); }} onCancel={() => setOpen("")} />}
              </div>
            ))}
          </div>
          <p className="os-small os-muted os-flat">{data.guide.tallNote}</p>
        </Card>
      )}

      <Card
        title="What your guide calls for"
        sub="Tick off what you own and it goes into your wardrobe."
        right={
          <label className="os-check os-small">
            <input type="checkbox" checked={showOwned} onChange={(e) => setShowOwned(e.target.checked)} /> Show owned
          </label>
        }
      >
        <table className="os-table os-table--wide">
          <tbody>
            {rows.map((c) => (
              <tr key={c.key} className={c.owned ? "os-muted" : ""}>
                <td style={{ width: 24 }}><Swatch hex={colors[c.color].hex} /></td>
                <td>
                  <strong>{c.name}</strong> <span className="os-tag">{PRIORITY[c.priority]}</span>
                  {linksFor(c.key) > 0 && <span className="os-tag os-tag--ok">{linksFor(c.key)} saved</span>}
                  <div className="os-small os-muted">{c.owned ? `You have: ${c.item?.name}` : c.look}</div>
                  {open === c.key && <SaveLink core={c} onSaved={() => { setOpen(""); onChanged(); }} onCancel={() => setOpen("")} />}
                </td>
                <td className="os-num">
                  {!c.owned && (
                    <span className="os-row os-small" style={{ justifyContent: "flex-end" }}>
                      <Pics q={c.search} />
                      <button className="os-link" onClick={() => setOpen(c.key)}>Save a link</button>
                      <button className="os-link" onClick={() => have(c)}>I have it</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="os-ok">You have every core piece. Shop for fit upgrades from here.</p>}
      </Card>

      <Card title="Saved links" sub="Paste a product link; the picture, title and price come with it when the store shares them.">
        <SaveLink onSaved={onChanged} />
        {want.length === 0 && <p className="os-small os-muted">No links saved yet.</p>}
        <div className="os-ideas" style={{ marginTop: 12 }}>
          {[...want, ...bought].map((s) => {
            const core = data.guide && s.core ? g.items.find((i) => i.key === s.core) : null;
            return (
              <div key={s._id} className={`os-idea${s.status === "bought" ? " os-idea--done" : ""}`}>
                <a href={s.url || undefined} target="_blank" rel="noreferrer" className="os-idea__img">
                  {s.image ? <img src={s.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <FiShoppingBag size={32} />}
                </a>
                <div className="os-idea__body">
                  <strong>{s.title}</strong>
                  <span className="os-small os-muted">
                    {[s.site, usd(s.price), core ? `for: ${core.name}` : s.slot ? SLOT_LABEL[s.slot] : null, s.status === "bought" ? "bought" : null].filter(Boolean).join(" · ")}
                  </span>
                  <div className="os-row os-small">
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer">Open <FiExternalLink /></a>
                    )}
                    {s.status === "want" && (
                      <button
                        className="os-link"
                        onClick={async () => {
                          await os.patch(`/style/shop/${s._id}`, { status: "bought", addToWardrobe: Boolean(s.slot && s.color) });
                          onChanged();
                        }}
                      >
                        Bought it{s.slot && s.color ? " (add to wardrobe)" : ""}
                      </button>
                    )}
                    <button
                      className="os-link"
                      onClick={async () => {
                        await os.delete(`/style/shop/${s._id}`);
                        onChanged();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

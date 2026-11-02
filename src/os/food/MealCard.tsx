import { FiCheck, FiExternalLink, FiMapPin, FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import { Pics } from "../Pics";
import type { Meal, Mode } from "./types";

/** One meal idea: what it is, recipe pictures or where to order, and "we're having this". */
export default function MealCard({ meal, mode, chosen, liked, onChoose, onVote }: { meal: Meal; mode: Mode; chosen: boolean; liked: boolean; onChoose?: () => void; onVote: (vote: "like" | "dislike" | "none") => void }) {
  return (
    <div className={`os-meal${chosen ? " os-meal--chosen" : ""}`}>
      <div className="os-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <strong>{meal.name}</strong>
        <span className="os-row os-small">
          <button className={`os-link${liked ? " os-on" : ""}`} title={liked ? "Liked (shows more often)" : "Like: show it more often"} onClick={() => onVote(liked ? "none" : "like")}><FiThumbsUp /></button>
          <button className="os-link" title="Not for us: hide it" onClick={() => onVote("dislike")}><FiThumbsDown /></button>
        </span>
      </div>
      <span className="os-small os-muted">
        {meal.cuisine}
        {mode === "cook" ? ` · ${meal.mins} min` : ""}
        {mode === "cook" && meal.batch ? " · makes leftovers" : ""}
      </span>
      {meal.desc && <span className="os-small">{meal.desc}</span>}
      {mode === "cook" && meal.note && <span className="os-small os-tip">Tip: {meal.note}</span>}
      {mode === "order" && meal.orderNote && <span className="os-small os-tip">When ordering: {meal.orderNote}</span>}
      <span className="os-row os-small">
        {mode === "order" ? (
          <a href={meal.orderUrl} target="_blank" rel="noreferrer"><FiMapPin /> Order nearby</a>
        ) : meal.link ? (
          <a href={meal.link} target="_blank" rel="noreferrer">Recipe <FiExternalLink /></a>
        ) : null}
        <Pics q={meal.search} label={mode === "cook" ? "recipe ideas" : "pictures"} />
      </span>
      {onChoose &&
        (chosen ? (
          <span className="os-ok os-small"><FiCheck /> Having this</span>
        ) : (
          <button className="os-btn os-btn--small" onClick={onChoose}>We're having this</button>
        ))}
    </div>
  );
}

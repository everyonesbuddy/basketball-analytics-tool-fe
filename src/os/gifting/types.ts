export type Group = "child" | "young" | "adult" | "elder";

export interface Person {
  _id: string;
  name: string;
  relationship: string;
  group: Group;
  gender: "man" | "woman" | null;
  tier: "close" | "thoughtful" | "casual";
  birthday: string | null;
  dates: { label: string; md: string }[];
  sizes: { shirt: string; shoe: string };
  likes: string;
  servicesOk?: boolean;
  inCircle?: boolean;
  notes: string;
  gifts: { _id?: string; date: string; what: string; cost: number | null }[];
}

export interface ShoppingRow {
  key: string;
  name: string;
  search?: string;
  category: string;
  store: string;
  qty: number;
  packs: number;
  packCount: number;
  packPrice: number;
  cost: number;
  spare: number;
  caution: string | null;
}

export interface GroupResult {
  people: number;
  packages: { group: string; groupName: string; count: number; package: string; name: string; search?: string; target: string; items: string[]; details?: { name: string; search?: string }[]; perPerson: number; trimmed: boolean }[];
  shopping: ShoppingRow[];
  totals: { items: number; packaging: number; tax: number; total: number; budget: number; left: number };
  steps: string[];
  over: boolean;
  perPerson: number;
  weight: { lb: number; capacityLb: number; fits: boolean };
  cautions: string[];
  packaging: { theme: string; note: string };
}

export interface HamperOption {
  key: string;
  name: string;
  search?: string;
  container: { name: string; price: number; search?: string };
  items: { name: string; price: number; search?: string }[];
  skipped: string[];
  card: { name: string; price: number };
  total: number;
  left: number;
}

export interface ServiceIdea {
  key: string;
  name: string;
  price: number;
  where: "us" | "ng" | "any";
  search: string;
  how: string;
  fits: boolean;
}

export interface HamperResult {
  relationship: string;
  budget: number;
  search?: string;
  services?: ServiceIdea[];
  best: HamperOption;
  alternatives: HamperOption[];
  tips: string[];
}

export interface GroupInputs {
  budget: number;
  counts: Record<Group, number>;
  special: number;
  womenShare: number;
  suitcases: number;
}

export interface OneInputs {
  budget: number;
  relationship: string;
  likes: string;
  services: boolean;
  where: "any" | "us" | "ng";
}

export interface Plan {
  _id: string;
  title: string;
  kind: "group" | "one";
  date: string | null;
  status: "planning" | "shopping" | "done";
  inputs: GroupInputs | OneInputs;
  result: GroupResult | HamperResult;
  person: string | null;
  checklist: { key: string; name: string; store: string; packs: number; bought: boolean; packed: boolean }[];
  notes: string;
}

export interface Idea {
  _id: string;
  url: string;
  title: string;
  image: string;
  price: number | null;
  site: string;
  person: string | null;
  notes: string;
}

export interface Reminder {
  kind: "date" | "overdue" | "shop" | "pack" | "nudge" | "care" | "circle";
  size?: "small" | "big";
  ideaKey?: string;
  personId?: string;
  planId?: string;
  priority: number;
  days?: number;
  text: string;
}

export interface Overview {
  people: Person[];
  plans: Plan[];
  ideas: Idea[];
  reminders: Reminder[];
  config: {
    relationships: { key: string; name: string }[];
    groups: { key: Group; name: string }[];
    packaging: { theme: string; note: string };
  };
}

// ── Care for your wife, and the gift circle ──────────────────────────────

export type CareKind = "pamper" | "active" | "social" | "quality" | "service" | "words" | "surprise";

export interface CareIdea {
  key: string;
  title: string;
  size: "small" | "big";
  kind: CareKind;
  price: number;
  lead: number;
  find: string | null;
  how: string;
  fits?: boolean;
  links: { label: string; url: string }[];
}

export interface CareDue {
  every: number;
  lastDone: string | null;
  since: number | null;
  nextOn: string;
  due: boolean;
  planned: { id: string; title: string; on: string } | null;
}

/** A kind of person in the gift circle (an uncle, a friend…), with a hamper idea. */
export interface CircleNext {
  relationship: string;
  name: string; // "Uncle"
  phrase: string; // "an uncle"
  last: string | null;
  since: number | null;
  hamper: { key: string; name: string; total: number; items: string[] };
  service: { key: string; name: string; price: number } | null;
}

export interface CareEntry {
  _id: string;
  kind: "care" | "circle";
  ideaKey: string | null;
  size: "small" | "big" | null;
  personId: string | null; // older circle entries
  relationship?: string | null;
  who?: string;
  title: string;
  status: "planned" | "done" | "skipped";
  date: string;
  plannedFor: string | null;
  cost: number | null;
  note: string;
}

export interface CarePrefs {
  spouseId: string | null;
  spouseName: string;
  likesKinds: CareKind[];
  dislikes: string[];
  wishlist: string;
  budgetSmall: number;
  budgetBig: number;
  smallEveryDays: number;
  bigEveryDays: number;
  circleOn: boolean;
  circleEveryDays: number;
  circleBudget: number;
  circleRelationships: string[];
}

export interface CareView {
  today: string;
  prefs: CarePrefs;
  spouse: { _id: string; name: string } | null;
  kinds: Record<CareKind, string>;
  ideas: CareIdea[];
  suggestions: { big: CareIdea[]; small: CareIdea[] };
  due: { small: CareDue; big: CareDue };
  circle: { every: number; budget: number; lastDone: string | null; nextOn: string; due: boolean; planned: { id: string; relationship: string | null; who: string; title: string; on: string | null } | null; next: CircleNext[]; eligible: number };
  log: CareEntry[];
  people: { _id: string; name: string; relationship: string; inCircle: boolean; last: string | null }[];
  relationships: { key: string; name: string }[];
}

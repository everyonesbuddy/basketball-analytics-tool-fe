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
  kind: "date" | "overdue" | "shop" | "pack" | "nudge";
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

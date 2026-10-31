export type Category = "P1" | "P2" | "PF1" | "PF2" | "PC1" | "PC2";
export type Mode = "m1" | "m2single" | "m2tiered";

export interface Goal {
  _id: string;
  category: Category;
  title: string;
  outcome: string;
  status: "active" | "completed" | "rolled" | "archived";
  windowStart: string;
  windowEnd: string;
  obstacle: { text: string; kind: "single" | "tiered"; bounded: boolean | null; parallel: boolean | null };
  toolReady: boolean;
  toolNeeded: string;
  percent: number;
  notes: string;
  completedAt?: string | null;
}

export interface GoalLog {
  _id: string;
  goal: string;
  date: string;
  mode: Mode;
  percentGained: number;
  cleared: boolean;
  toolAcquired: boolean;
  note: string;
}

export interface WindowStatus {
  totalDays: number;
  daysLeft: number;
  ended: boolean;
  done: boolean;
  next: { scenario: "early" | "on-time" | "rollover"; text: string } | null;
}

export interface Block {
  start: string;
  end: string;
  label: string;
  goal?: Category;
  review?: boolean;
  now: boolean;
  past: boolean;
  category: Category | null;
  goalId: string | null;
  goalTitle: string | null;
  mode: Mode | null;
  modeName: string | null;
  reason: string | null;
  loggedToday: boolean;
}

export interface TodayGoal {
  category: Category;
  categoryName: string;
  goal: Goal | null;
  mode: Mode | null;
  modeName: string | null;
  reason: string | null;
  ceiling: { hit: boolean; recent?: number; before?: number } | null;
  window: WindowStatus | null;
  loggedToday: boolean;
}

export interface Attention {
  kind: "missing" | "early" | "on-time" | "rollover" | "ceiling" | "review";
  category?: Category;
  goalId?: string;
  text: string;
}

export interface ModeInfo {
  name: string;
  short: string;
  what: string;
}

export interface Today {
  date: string;
  weekday: string;
  dayType: "v1" | "v2" | "weekend";
  scheduleName: string;
  now: Block | null;
  nextGoalBlock: Block | null;
  blocks: Block[];
  goals: TodayGoal[];
  attention: Attention[];
  quote: string;
  modes: Record<Mode, ModeInfo>;
}

export interface CategoryInfo {
  key: Category;
  name: string;
  group: string;
  months: number;
  about: string;
}

export interface ScheduleBlock {
  start: string;
  end: string;
  label: string;
  goal?: Category;
  review?: boolean;
}

export interface Framework {
  categories: CategoryInfo[];
  schedules: Record<"v1" | "v2" | "weekend", { name: string; blocks: ScheduleBlock[] }>;
  modes: Record<Mode, ModeInfo>;
  framework: {
    intro: string;
    terms: { term: string; text: string }[];
    goalStandard: string[];
    classify: string[];
    windowEnd: { when: string; then: string }[];
    focus: string;
    principles: string[];
  };
  quotes: string[];
}

export interface ReviewGoal {
  goalId: string;
  category: Category;
  title: string;
  mode: Mode;
  modeName: string;
  reason: string;
  sessions: number;
  percentThisWeek: number;
  percentTotal: number;
  cleared: boolean;
  toolAcquired: boolean;
  ceiling: { hit: boolean; recent?: number; before?: number; sessions?: number };
  window: WindowStatus;
}

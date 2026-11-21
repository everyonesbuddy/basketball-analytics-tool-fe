export interface LessonRecord {
  key: string;
  best: number;
  stars: number;
  attempts: number;
  stepDone: boolean;
  bestBpm: number;
  lastAt: string | null;
}

export interface BassView {
  lessons: Record<string, LessonRecord>;
  streak: number;
  weekMinutes: number;
  todayMinutes: number;
  days: { date: string; minutes: number }[];
  sensitivity: number;
}

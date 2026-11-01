export type TmEvent = {
  id: string;
  name: string;
  url: string;
  image: string;
  date: string | null;
  time: string | null;
  status: string;
  venue: string;
  city: string;
  distance: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  onsaleAt: string | null;
  presales: { name: string; start: string; end: string }[];
  segment: string;
  genre: string;
};
export type Attraction = { id: string; name: string; image: string; segment: string; genre: string; upcoming: number | null; url: string };
export type Follow = { _id: string; tmId: string; name: string; image: string; segment: string; genre: string };
export type SavedStatus = "interested" | "going" | "bought";
export type SavedEvent = { _id: string; tmId: string; name: string; url: string; image: string; date: string | null; time: string | null; venue: string; city: string; priceMin: number | null; priceMax: number | null; onsaleAt: string | null; status: SavedStatus; notes: string };
export type EventSettings = { city: string; lat: number | null; lon: number | null; radius: number };
export type EventsOverview = { configured: boolean; today: string; settings: EventSettings; follows: Follow[]; saved: SavedEvent[]; past: SavedEvent[]; reminders: { kind: string; text: string }[]; segments: string[] };
export type FollowGroup = { follow: Follow; near: TmEvent[]; elsewhere: TmEvent[]; total: number };

export const STATUS_LABEL: Record<SavedStatus, string> = { interested: "Interested", going: "Going (need tickets)", bought: "Got tickets" };

export type Slot = "top" | "bottom" | "layer" | "shoe";
export type StructureKey = "monochrome" | "neutral_accent" | "contrast";

export type Color = { name: string; family: string; hex: string; neutral?: boolean };
export type Look = { key: string; name?: string; structure: StructureKey; family?: string; occasions: string[]; pieces: [Slot, string, string][]; search: string };
export type Guide = {
  colors: Record<string, Color>;
  tonal: Record<string, { name: string; colors: string[]; search: string }>;
  structures: Record<StructureKey, { name: string; short: string; why: string }>;
  silhouette: string[];
  occasions: Record<string, { name: string; structures: StructureKey[]; shoe: string; chunky?: boolean }>;
  looks: Look[];
  tallNote: string;
};

export type WardrobeItem = { _id: string; name: string; slot: Slot; color: string; note: string; link: string; image: string; active: boolean };
export type ShopItem = { _id: string; url: string; title: string; image: string; price: number | null; site: string; slot: Slot | null; color: string | null; core: string | null; notes: string; status: "want" | "bought" };
export type OutfitLog = { _id: string; date: string; occasion: string; lookKey: string; structure: string; family: string | null; name: string; items: string[] };
export type CorePiece = { key: string; slot: Slot; color: string; name: string; priority: 1 | 2 | 3; look: string; search: string; owned: boolean; item: { _id: string; name: string } | null };
export type Gaps = { items: CorePiece[]; missing: number; owned: number; next: CorePiece[] };
export type Profile = { city: string; lat: number | null; lon: number | null };

export type StyleOverview = { today: string; profile: Profile; wardrobe: WardrobeItem[]; shop: ShopItem[]; recent: OutfitLog[]; gaps: Gaps; guide: Guide };

export type Piece = { slot: Slot; color: string; colorName: string; hex: string; desc: string; item: { _id: string; name: string; color: string; image: string } | null; missing: boolean; optional: boolean };
export type Outfit = { key: string; name: string; structure: StructureKey; structureName: string; family: string | null; why: string; layer: "wear" | "optional" | "skip"; pieces: Piece[]; notes: string[]; owned: number; total: number; search: string };
export type Suggestion = { occasion: string; occasionName: string; shoe: string; layer: { layer: string; why: string }; outfits: Outfit[]; wornToday: OutfitLog[] };

export const SLOT_LABEL: Record<Slot, string> = { top: "Top", bottom: "Bottom", layer: "Layer", shoe: "Shoes" };
export const SLOTS: Slot[] = ["top", "bottom", "layer", "shoe"];

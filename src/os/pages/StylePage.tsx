import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import os from "../api";
import { ErrorNote, Loading, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import GuideTab from "../style/GuideTab";
import OutfitTab from "../style/OutfitTab";
import ShopTab from "../style/ShopTab";
import WardrobeTab from "../style/WardrobeTab";
import type { StyleOverview } from "../style/types";
import { useLoad } from "../useLoad";

function ShopRoute({ data, reload }: { data: StyleOverview; reload: () => void }) {
  const [params] = useSearchParams();
  const slot = params.get("slot");
  const color = params.get("color");
  return <ShopTab data={data} onChanged={reload} focus={slot && color ? { slot, color } : undefined} />;
}

/** Style: today's outfit, the guide, the wardrobe, and the shopping list. */
export default function StylePage() {
  const { data, error, reload } = useLoad<StyleOverview>(() => os.get("/style").then((r) => r.data));
  const navigate = useNavigate();
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const want = data.shop.filter((s) => s.status === "want").length;
  return (
    <div className="os-page">
      <PageHead title="Style" sub="One straight line, the right color structure for the occasion, and the layer the weather calls for." />
      <SubNav
        items={[
          ["/style", "Today's outfit", true],
          ["/style/wardrobe", `Wardrobe (${data.wardrobe.filter((w) => w.active).length})`],
          ["/style/shop", `Shopping (${data.gaps.missing + want})`],
          ["/style/guide", "Guide"],
        ]}
      />
      <Routes>
        <Route index element={<OutfitTab data={data} onChanged={reload} onShop={(slot, color) => navigate(`/style/shop?slot=${slot}&color=${color}`)} />} />
        <Route path="wardrobe" element={<WardrobeTab data={data} onChanged={reload} />} />
        <Route path="shop" element={<ShopRoute data={data} reload={reload} />} />
        <Route path="guide" element={<GuideTab guide={data.guide} />} />
      </Routes>
    </div>
  );
}

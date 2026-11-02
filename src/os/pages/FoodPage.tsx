import { Route, Routes } from "react-router-dom";
import os from "../api";
import { ErrorNote, Loading, PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import MealsTab from "../food/MealsTab";
import TodayTab from "../food/TodayTab";
import WeekTab from "../food/WeekTab";
import type { FoodOverview } from "../food/types";
import { useLoad } from "../useLoad";

/** Food: what to eat today (cook or order), the week's dinners and grocery list, and the meals. */
export default function FoodPage() {
  const { data, error, reload } = useLoad<FoodOverview>(() => os.get("/food").then((r) => r.data));
  if (error) return <ErrorNote text={error} />;
  if (!data) return <Loading />;
  const vote = async (key: string, v: "like" | "dislike" | "none") => {
    await os.post("/food/vote", { key, vote: v });
    reload();
  };
  const left = data.plans.current?.grocery.filter((g) => !g.staple && !g.bought).length;
  return (
    <div className="os-page">
      <PageHead title="Food" sub="What to eat today, cook or order, and one grocery run for the week." />
      <SubNav
        items={[
          ["/food", "Today", true],
          ["/food/week", `This week${left ? ` (${left} to buy)` : ""}`],
          ["/food/meals", `Meals (${data.meals.length})`],
        ]}
      />
      <Routes>
        <Route index element={<TodayTab key={data.date} data={data} reload={reload} vote={vote} />} />
        <Route path="week" element={<WeekTab data={data} reload={reload} />} />
        <Route path="meals" element={<MealsTab data={data} reload={reload} vote={vote} />} />
      </Routes>
    </div>
  );
}

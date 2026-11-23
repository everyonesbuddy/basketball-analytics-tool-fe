import { Route, Routes } from "react-router-dom";
import { PageHead } from "../Bits";
import { SubNav } from "../gifting/SubNav";
import Dashboard from "../../components/Dashboard";
import BetsBoard from "../sports/BetsBoard";
import MyBets from "../sports/MyBets";

/**
 * Sports in one place: bet ideas from the numbers, the bets you placed, and
 * the fantasy and NBA tools worth keeping (the rest are retired from view).
 */
export default function SportsPage() {
  return (
    <div className="os-page">
      <PageHead
        title="Sports"
        sub="Bet ideas from the numbers, your bets and record, and the fantasy and NBA tools you actually use."
      />
      <SubNav
        items={[
          ["/sports", "Bets", true],
          ["/sports/my-bets", "My bets"],
          ["/sports/fantasy", "Fantasy"],
          ["/sports/nba", "NBA"],
        ]}
      />
      <Routes>
        <Route index element={<BetsBoard />} />
        <Route path="my-bets" element={<MyBets />} />
        <Route
          path="fantasy"
          element={<Dashboard key="fantasy" section="fantasy" />}
        />
        <Route path="nba" element={<Dashboard key="nba" section="nba" />} />
      </Routes>
    </div>
  );
}

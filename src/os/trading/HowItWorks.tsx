import { Link } from "react-router-dom";
import { Card } from "../Bits";

/** The indicators it reads, in plain words. */
const READINGS: { name: string; what: string; how: string }[] = [
  {
    name: "Trend: 20-day and 50-day averages",
    what: "The average price over the last 20 and 50 trading days (weighted toward recent days).",
    how: "Price above both, with the 20 above the 50, is an uptrend. The mirror is a downtrend.",
  },
  {
    name: "RSI (14 days)",
    what: "0 to 100: how hard price has been pushed one way lately.",
    how: "Under 30 is oversold (sold off hard), over 70 is stretched. 55–75 is strong without being overdone.",
  },
  {
    name: "Bollinger bands (20 days, 2 SD)",
    what: "A channel around the 20-day average that holds most normal days.",
    how: "Closing at or below the lower band is an unusually low price. At the upper band, unusually high.",
  },
  {
    name: "Stochastic",
    what: "Where today's close sits in the recent high–low range, with a slower line beside it.",
    how: "Low readings, or the fast line crossing back above the slow one, suggest a turn up is starting.",
  },
  {
    name: "MACD histogram",
    what: "Momentum: whether the short-term trend is speeding up or slowing down.",
    how: "Rising from yesterday means momentum is improving, even if price hasn't turned yet.",
  },
  {
    name: "Volume vs normal",
    what: "Today's volume divided by the 20-day average.",
    how: "1.3x or more means real buying or selling is behind the move, which a breakout needs.",
  },
  {
    name: "ATR (14 days)",
    what: "The average daily range: how much this symbol normally moves in a day.",
    how: "Used to set stops and targets that fit the symbol, so a jumpy stock gets more room than a calm one.",
  },
  {
    name: "Support and resistance",
    what: "Past swing lows and highs: a bar lower or higher than the 5 days either side of it.",
    how: "Stops go just past the nearest one; targets aim at the next one in the way.",
  },
];

/** The five setups and the checks each one needs. */
const SETUPS: { name: string; dir: string; need: string; checks: string[]; idea: string }[] = [
  {
    name: "Pullback in an uptrend",
    dir: "Up",
    need: "Uptrend + 2 more of 4",
    checks: ["Uptrend (must have)", "RSI under 45", "At the lower Bollinger band", "Stochastic low or turning up", "MACD improving"],
    idea: "A stock that's been going up dips. Buy the dip, betting the trend carries on.",
  },
  {
    name: "Breakout to a 20-day high",
    dir: "Up",
    need: "New high + 3 more of 4",
    checks: ["Closed at a new 20-day high (must have)", "Volume 1.3x normal", "RSI 55–75", "MACD positive and rising", "Trend lined up"],
    idea: "Price breaks out of its recent range with volume behind it. Ride the momentum.",
  },
  {
    name: "Oversold bounce",
    dir: "Up",
    need: "RSI under 32 + 2 more of 4",
    checks: ["RSI under 32 (must have)", "Closed below the lower band", "Stochastic very low or turning up", "First up day", "MACD improving"],
    idea: "Sold off too hard, too fast. Bet on a snap back. Goes against the trend, so riskier.",
  },
  {
    name: "Rally in a downtrend",
    dir: "Down (puts)",
    need: "Downtrend + 2 more of 4",
    checks: ["Downtrend (must have)", "RSI over 55", "At the upper Bollinger band", "Stochastic high or turning down", "MACD fading"],
    idea: "The mirror of a pullback: a falling stock pops up, betting it rolls over again.",
  },
  {
    name: "Breakdown to a 20-day low",
    dir: "Down (puts)",
    need: "New low + 3 more of 4",
    checks: ["Closed at a new 20-day low (must have)", "Volume 1.3x normal", "RSI 25–45", "MACD negative and falling", "Trend lined up down"],
    idea: "The mirror of a breakout: price breaks down with volume.",
  },
];

/**
 * The full explanation of the trading desk: what it reads, the rules it
 * uses to find, plan, score and size ideas, and what it can't see.
 */
export default function HowItWorks() {
  return (
    <div className="os-page">
      <Card
        title="In one minute"
        sub="It's a rule-follower, not a predictor."
      >
        <ol className="os-tr-steps">
          <li>
            <strong>Read</strong> two years of daily prices for every symbol on
            your watchlists.
          </li>
          <li>
            <strong>Look for</strong> five chart patterns (setups) on today's
            candle, each confirmed by a handful of checks.
          </li>
          <li>
            <strong>Plan</strong> each one: entry at today's close, a stop
            below support, a target at the next resistance. It drops any where
            the reward isn't at least 1.5x the risk.
          </li>
          <li>
            <strong>Test</strong> the same setup on this symbol's past two
            years: how often did it reach that target before that stop?
          </li>
          <li>
            <strong>Score</strong> it 0–100 and sort it into a single, double,
            triple or home run by the size of the move.
          </li>
          <li>
            <strong>Add options and a size</strong>: the best contract for each
            base, and how much to put on so a stop-out costs what your weekly
            budget allows.
          </li>
        </ol>
        <p className="os-small os-muted os-flat">
          It never places trades. You decide, you place it at your broker, then
          track it here so the record stays honest.
        </p>
      </Card>

      <Card
        title="What it reads"
        sub="Daily candles from Yahoo Finance: open, high, low, close and volume for each day, about the last two years. For stocks, also the option chains (bid, ask, implied volatility, open interest) for expiries 6 to 75 days out."
      >
        <div className="os-howgrid">
          {READINGS.map((r) => (
            <div key={r.name} className="os-howgrid__item">
              <strong>{r.name}</strong>
              <p>{r.what}</p>
              <p className="os-small os-muted">{r.how}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="The five setups"
        sub="Each setup has a must-have check plus extras. Strength is the share of all five checks that passed: 3 of 5 is 60, 5 of 5 is 100. The ticks on an idea are the checks that passed."
      >
        <div className="os-howgrid">
          {SETUPS.map((s) => (
            <div key={s.name} className="os-howgrid__item">
              <strong>{s.name}</strong>
              <span className="os-small os-muted">
                {s.dir} · needs {s.need}
              </span>
              <p>{s.idea}</p>
              <ul className="os-tr-checks">
                {s.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
          Down setups on stocks only show up as put ideas: it never suggests
          shorting shares. Crypto is long only.
        </p>
      </Card>

      <Card title="Stop and target">
        <div className="os-how">
          <p>
            <strong>Entry</strong> is the last daily close. If price has moved
            since, the plan shifts with it.
          </p>
          <p>
            <strong>Stop</strong> (going up): just under the nearest support,
            but never more than 1.5 average daily ranges (ATR) away and never
            closer than 0.75. Close enough to stay small, far enough not to get
            shaken out by a normal day.
          </p>
          <p>
            <strong>Target</strong>: the next resistance at least 1.5 ATR
            away, capped at 4 ATR, about what a swing realistically gives in a
            few weeks. With no resistance in the way it aims for 2.5 ATR.
          </p>
          <p>
            <strong>Reward : risk</strong> is the distance to the target over
            the distance to the stop. Under 1.5 : 1, the idea is dropped.
          </p>
          <p>
            Going down (puts), everything is the mirror image.
          </p>
        </div>
      </Card>

      <Card
        title="“Before, here”: the track record"
        sub="The most important number on an idea."
      >
        <div className="os-how">
          <p>
            It replays the last two years of this symbol. Every time the same
            setup fired, it asks: did price reach the same % gain before the
            same % loss, within 20 trading days?
          </p>
          <p>
            <strong>Hit</strong> means the target came first.{" "}
            <strong>Miss</strong> means the stop came first. If both were
            touched the same day, it counts as a miss, to be safe. If neither
            happened in 20 days, it counts at wherever price ended.
          </p>
          <p>
            “2 of 6, 33% hit, avg -1.2%” means: of the 6 past times, 2
            reached the target, and on average the trade lost 1.2%. Under 35%
            with 5 or more examples gets a warning. Fewer than 3 examples isn't
            much to go on.
          </p>
        </div>
      </Card>

      <Card title="The score (0–100)">
        <table className="os-table os-table--wide">
          <thead>
            <tr>
              <th>Part</th>
              <th>How</th>
              <th className="os-num">Up to</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Setup fit</td>
              <td>Strength × 0.3</td>
              <td className="os-num">30</td>
            </tr>
            <tr>
              <td>Reward for the risk</td>
              <td>Reward : risk × 8, counted up to 3 : 1</td>
              <td className="os-num">24</td>
            </tr>
            <tr>
              <td>Track record</td>
              <td>
                With 5+ past examples: hit rate × 40, plus average return × 2
                (between -10 and +10). With 2–4 examples: a flat 14. With
                fewer: 10.
              </td>
              <td className="os-num">50</td>
            </tr>
          </tbody>
        </table>
        <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
          The track record is half the score on purpose. A setup that usually
          failed on this symbol can't score high on looks alone. Ideas under
          your minimum score (Settings, 45 to start) are hidden, and only ideas
          that pass it trigger a phone alert.
        </p>
      </Card>

      <Card
        title="Bases and options"
        sub="The base is just the size of the target move."
      >
        <table className="os-table os-table--wide">
          <thead>
            <tr>
              <th>Base</th>
              <th className="os-num">Shares / coins</th>
              <th className="os-num">Options</th>
              <th>Contract it picks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Single</td>
              <td className="os-num">+2.5–5%</td>
              <td className="os-num">+12–25%</td>
              <td>In the money (delta 0.68–0.85), 25–70 days</td>
            </tr>
            <tr>
              <td>Double</td>
              <td className="os-num">+5–10%</td>
              <td className="os-num">+25–50%</td>
              <td>At the money (0.48–0.62), 21–60 days</td>
            </tr>
            <tr>
              <td>Triple</td>
              <td className="os-num">+10–20%</td>
              <td className="os-num">+50–100%</td>
              <td>A little out of the money (0.30–0.45), 21–50 days</td>
            </tr>
            <tr>
              <td>Home run</td>
              <td className="os-num">+20%+</td>
              <td className="os-num">+100%+</td>
              <td>Cheap, out of the money (0.12–0.28), 7–30 days</td>
            </tr>
          </tbody>
        </table>
        <div className="os-how" style={{ marginTop: 10 }}>
          <p>
            The same stock idea comes with up to four contracts, one per base.
            For each, it skips contracts with wide bid–ask spreads, then
            estimates what the option would be worth if the stock hits the
            target or the stop in about two weeks (or halfway to expiry, if
            sooner). It uses Black-Scholes with the contract's own implied
            volatility. That's where the option's gain and loss % come from,
            and so its base.
          </p>
          <p className="os-small os-muted">
            It's an estimate. Implied volatility often drops after a move, and
            time decay speeds up near expiry, so short contracts usually do
            worse than the estimate.
          </p>
        </div>
      </Card>

      <Card title="How much to put on">
        <div className="os-how">
          <p>
            You set a <strong>weekly risk budget</strong> in Settings, the most
            you're OK losing in a week. It's split by base (50% singles, 30%
            doubles, 15% triples, 5% home runs to start).
          </p>
          <p>
            <strong>Shares and coins</strong>: the quantity where hitting the
            stop loses that base's share. Example: a $200 budget makes $100
            for singles. With entry $50 and stop $48, that's $2 a share, so 50
            shares.
          </p>
          <p>
            <strong>Options</strong>: a home run risks the whole premium. The
            other bases count the estimated loss at the stop.
          </p>
          <p className="os-small os-muted">
            If one share or contract already costs more than the budget for
            that base, it says so instead of sizing it.
          </p>
        </div>
      </Card>

      <Card title="When it runs">
        <div className="os-how">
          <p>
            Stocks are scanned at 10:00 and 3:30 on weekdays. Crypto is scanned
            every 4 hours. You can also press Scan now. Open plays are checked
            against the live price every 15 minutes (crypto around the clock),
            and you get a push when one hits its target or stop, plus a heads-up
            two days before an option expires.
          </p>
        </div>
      </Card>

      <Card title="What it can't see">
        <ul className="os-tr-checks os-tr-checks--warn">
          <li>
            News, earnings dates, guidance or anything company-specific. Check
            for earnings before an options play: a report can jump price past
            any stop.
          </li>
          <li>
            The wider market. A great setup in a falling market often fails.
          </li>
          <li>
            Intraday patterns. Setups come from daily candles only, and a fast
            drop can blow through a stop between 15-minute checks.
          </li>
          <li>
            The future. Two years of history is a guide, not a promise, and a
            handful of examples can be luck.
          </li>
        </ul>
        <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
          Your own <Link to="/trading/record">Record</Link> is the real test:
          after 20–30 tracked plays you'll see which setups and bases actually
          work for you.
        </p>
      </Card>
    </div>
  );
}

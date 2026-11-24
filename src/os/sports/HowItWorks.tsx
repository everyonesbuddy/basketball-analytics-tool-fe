import { Card } from "../Bits";

/** The betting strategy in plain words: how we make our own lines and when we bet against the book's. */
export default function HowItWorks() {
  return (
    <div className="os-page">
      <Card
        title="The strategy: value betting with power ratings"
        sub="We make our own line, compare it to the sportsbook's, and only bet where they disagree by enough to beat the book's cut."
      >
        <ol className="os-tr-steps">
          <li>
            <strong>Rate every team</strong> from this season's scores.
          </li>
          <li>
            <strong>Make our own line</strong> for each game (spread, total,
            win chance) and each player prop.
          </li>
          <li>
            <strong>Blend</strong> our chance half and half with the book's.
            Books are sharp, so this keeps us humble. That gives the{" "}
            <em>middle line</em>, the one we bet from.
          </li>
          <li>
            <strong>Bet only with an edge</strong>: our chance has to beat
            what the price needs by 2.5 points or more (3 for props).
          </li>
          <li>
            <strong>Shop it</strong>: every pick says the worst line and price
            still worth taking at your book. Past that, skip it.
          </li>
        </ol>
        <p className="os-small os-muted os-flat">
          Pros call this model-based handicapping. It never places bets: you
          place them at your book and track them here.
        </p>
      </Card>

      <Card title="1 · Power ratings: how good each team is">
        <div className="os-how">
          <p>
            Every team gets one number: how many points it beats an average
            team by on a neutral floor. It comes from every score this season,
            adjusted for who they played, so beating good teams counts more.
            The method is the Simple Rating System, the same idea as Sagarin
            or KenPom.
          </p>
          <p>
            Early in the season the ratings are pulled toward average. Ten
            games prove a lot less than fifty.
          </p>
          <p className="os-small os-muted">
            Example: Boston +6.5 means Boston beats an average team by 6.5.
            Philadelphia −2.1 means it loses to one by 2.1.
          </p>
        </div>
      </Card>

      <Card title="2 · Our own line">
        <div className="os-how">
          <p>
            <strong>Spread</strong> = home rating − away rating + home edge
            (2.3 points NBA, 1.5 NFL). Boston (+6.5) hosting Philadelphia
            (−2.1): 6.5 + 2.1 + 2.3 = Boston by 10.9, so our line is{" "}
            <strong>BOS −11</strong>.
          </p>
          <p>
            <strong>Total</strong>: each team's scoring against the other's
            defense, measured from the league average. Then the two are added.
          </p>
          <p>
            <strong>Win chance</strong>: results swing about 12.5 points
            around a projection in the NBA (13.5 NFL). So being 10.9 points
            better wins about 81% of the time.
          </p>
          <p>
            <strong>Props</strong>: half the player's last 5 games, half his
            last 15. His own game-to-game swing turns that into a chance of
            going over.
          </p>
        </div>
      </Card>

      <Card title="3 · Ours vs the book's">
        <div className="os-how">
          <p>
            Every game shows three lines: <strong>ours</strong>, the{" "}
            <strong>book's</strong> (DraftKings via ESPN), and the{" "}
            <strong>middle</strong>, our chance blended half and half with the
            book's. Picks come from the middle, never from our raw line.
          </p>
          <p>
            <strong>Why the book's line is different</strong>: the book
            prices in things we can't see, like injuries, rest days, travel,
            lineup news and recent form. Sharp bettors also push its line
            toward the truth. We only see season scores, so when we disagree
            the book is often right. That's why we meet it halfway.
          </p>
          <p>
            <strong>A big gap</strong> (6+ points NBA, 4+ NFL) usually means
            news, not an edge. Check the injury report before betting it.
          </p>
        </div>
      </Card>

      <Card title="4 · When it's a bet">
        <div className="os-how">
          <p>
            The price sets the chance you need. At −110 you need 52.4% (you
            risk $110 to win $100). At +150 you need 40%.
          </p>
          <p>
            <strong>Edge</strong> = our (middle) chance − what the price
            needs. We show picks with +2.5% or more, and +3% for props.
            Strong is 6%+ (7% for props), Good is 3.5%+ (4.5% for props),
            Lean is the rest.
          </p>
          <p>
            <strong>Parlays</strong> only combine picks that each have an
            edge, from different games, so the legs don't depend on each
            other. The payout is bigger and the chance much lower, so stake
            small.
          </p>
        </div>
      </Card>

      <Card title="5 · Shopping your line">
        <div className="os-how">
          <p>
            You don't bet at ESPN. Your book's number may differ, so each pick
            says:
          </p>
          <ul className="os-tr-checks">
            <li>
              the worst <strong>price</strong> at this line that's still worth
              it (e.g. −130 or better)
            </li>
            <li>
              the worst <strong>line</strong> at −110 that's still worth it
              (e.g. fine as far as −6.5)
            </li>
            <li>a better number is always fine; past the range, skip it</li>
          </ul>
          <p className="os-small os-muted">
            NFL spreads never go past 3 or 7: so many games land on those
            margins that crossing them costs more than it looks.
          </p>
        </div>
      </Card>

      <Card title="How to know if it's working">
        <div className="os-how">
          <p>
            Even good bettors only win 53–55% of bets at −110, so streaks
            mean little. Two things tell you more:
          </p>
          <ul className="os-tr-checks">
            <li>
              <strong>Return in My bets</strong> after 50–100 bets, not 10.
            </li>
            <li>
              <strong>Beating the closing line</strong>: if you took BOS −5.5
              and it closed at −7, the market moved your way. Doing that often
              is the best sign of a real edge, win or lose.
            </li>
          </ul>
          <p>
            Keep stakes flat, about 1–2% of your bankroll a bet, with parlays
            and props smaller. Never chase losses by betting bigger.
          </p>
        </div>
      </Card>

      <Card title="What it can't see">
        <ul className="os-tr-checks os-tr-checks--warn">
          <li>Injuries, rest and lineup news, until they show up in scores.</li>
          <li>Matchups: who guards whom, pace, style.</li>
          <li>For props: minutes limits, role changes, blowouts.</li>
          <li>The future. A model is a guide, and books are good at this.</li>
        </ul>
      </Card>
    </div>
  );
}

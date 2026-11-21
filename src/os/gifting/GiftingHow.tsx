import { Link } from "react-router-dom";

const TABS: { to: string; name: string; what: string; when: string }[] = [
  {
    to: "/gifting",
    name: "Coming up",
    what: "Everything that needs you, in one list: birthdays and anniversaries, what's due for your wife, the gift circle, and gifts you're planning. The same reminders go to your phone.",
    when: "Check it when you get a reminder, or glance at it once a week.",
  },
  {
    to: "/gifting/care",
    name: "For your wife",
    what: "Looking after her with experiences more than things: something booked about once a month (a massage, a date night, a class) and a small gesture every week, in your budget and from the kinds of things she likes.",
    when: "Plan the idea for a date, mark it done after. Tell it what she likes and what she's mentioned wanting.",
  },
  {
    to: "/gifting/circle",
    name: "Gift circle",
    what: "Surprise gifts for no occasion. Every month or so it says who's next (your mom, an uncle, a friend…) with a hamper idea. You don't add anyone; you pick who when it comes up.",
    when: "Wait for the reminder, then build the hamper or note that you gave it. It decides when; you decide who.",
  },
  {
    to: "/gifting/new",
    name: "Plan a gift",
    what: "The workbench. For one person: a hamper or gift box in budget, with the items, costs and a shopping and packing checklist. For a group (like December back home): splits the budget across everyone and checks it fits in your suitcases.",
    when: "Use it when you already know you're giving something and need to work out what. The circle's Build the hamper opens it for you.",
  },
  {
    to: "/gifting/people",
    name: "People",
    what: "Only the people with something worth remembering: a birthday or anniversary, sizes, what they love.",
    when: "Add someone once; their dates then show up in Coming up.",
  },
  {
    to: "/gifting/ideas",
    name: "Ideas",
    what: "Links to things you spot for someone (\"Mum would love this\"), saved for later.",
    when: "Paste a link the moment you see it, then find it when it's time.",
  },
];

/** What each gifting tab is for, as a one-line summary that opens up. */
export default function GiftingHow({ wifeName }: { wifeName?: string }) {
  return (
    <details className="os-how-box">
      <summary>
        <strong>What each tab is for:</strong> reminders, your wife, the gift circle, planning a gift, people and saved ideas. <span className="os-link">How it works</span>
      </summary>
      <div className="os-howgrid">
        {TABS.map((t) => (
          <div key={t.to} className="os-howgrid__item">
            <Link to={t.to}>{t.to === "/gifting/care" && wifeName ? `For ${wifeName}` : t.name}</Link>
            <p>{t.what}</p>
            <p className="os-small os-muted">{t.when}</p>
          </div>
        ))}
      </div>
      <p className="os-small os-muted os-flat" style={{ marginTop: 10 }}>
        In short: the gift circle tells you when and who to gift; Plan a gift works out what to give and keeps it in budget.
      </p>
    </details>
  );
}

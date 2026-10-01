import type { Metadata } from "next";
import ContentPage from "@/components/content-page";
import { guides } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

const entry = guides.find((g) => g.path === "/guides/when-are-wedding-rsvps-due")!;

export const metadata: Metadata = pageMetadata({
  title: "When should wedding RSVPs be due? A simple timeline",
  description:
    "How far before the wedding to set your RSVP deadline, how to work it back from your caterer and venue, and what to do about guests who don’t reply.",
  path: entry.path,
  card: entry.card,
});

export default function Page() {
  return (
    <ContentPage
      article
      actions={false}
      entry={entry}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: "RSVP deadlines", path: entry.path },
      ]}
      kicker="Guide · Replies"
      title={
        <>
          When should wedding
          <em>RSVPs be due?</em>
        </>
      }
      lede="Most couples set their RSVP deadline three to four weeks before the wedding. The right date for you depends on one thing: when your caterer and venue need final numbers. Here is how to work it out, and what to do when replies run late."
      imageAlt="A candlelit wedding dinner table set outdoors at night"
      caption="Every seat accounted for."
    >
      <h2>The short answer</h2>
      <p>
        Set your RSVP deadline <strong>three to four weeks before the
        wedding</strong>. That leaves a week to chase late replies and still
        give your suppliers firm numbers with time to spare. For a destination
        wedding or one with lots of travel, move it earlier: six to eight weeks
        before, so guests commit before flight and hotel prices climb and your
        room blocks can be released.
      </p>

      <h2>Work backwards from your suppliers</h2>
      <p>
        The deadline that matters is not yours, it is your caterer’s. Ask your
        caterer and venue when they need a final headcount and final meal
        choices, then count back:
      </p>
      <ol>
        <li>
          <strong>Supplier deadline</strong>: often one to two weeks before
          the wedding, but check your contract.
        </li>
        <li>
          <strong>Minus one week for chasing</strong>: some replies always
          arrive late, and you need time to follow up personally.
        </li>
        <li>
          <strong>Minus a few days for the seating plan</strong>: tables can’t
          be finished until you know who is coming.
        </li>
      </ol>
      <p>
        The result is your RSVP deadline. If your caterer needs numbers two
        weeks out, a deadline four weeks before the wedding is comfortable.
      </p>

      <h2>A complete invitation timeline</h2>
      <div className="table-scroll">
        <table className="content-table">
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Local wedding</th>
              <th scope="col">Destination wedding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Save-the-dates</th>
              <td>6 to 8 months before</td>
              <td>8 to 12 months before</td>
            </tr>
            <tr>
              <th scope="row">Invitations</th>
              <td>6 to 8 weeks before</td>
              <td>3 to 4 months before</td>
            </tr>
            <tr>
              <th scope="row">RSVP deadline</th>
              <td>3 to 4 weeks before</td>
              <td>6 to 8 weeks before</td>
            </tr>
            <tr>
              <th scope="row">Final numbers to suppliers</th>
              <td colSpan={2}>Whenever your contracts say, often 1 to 2 weeks before</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        These are conventions, not rules. A small wedding in your own town can
        run shorter; a large wedding over a holiday weekend should run longer.
      </p>

      <h2>How to word the RSVP date</h2>
      <p>
        Be specific and use a weekday guests can picture: “Kindly reply by
        Friday, May 14” is clearer than “Please RSVP by mid-May”. On a digital
        invitation, show the deadline beside the reply itself so it is the last
        thing a guest reads before they answer.
      </p>
      <div className="content-note">
        <strong>In Vow Motion</strong>
        <p>
          Your RSVP deadline appears on every household’s invitation, and guests
          can change their reply from the same link until that date.
        </p>
      </div>

      <h2>What to do about late replies</h2>
      <p>
        Some guests will miss the deadline. That is normal, and rarely personal.
      </p>
      <ul>
        <li>
          <strong>Send one friendly reminder</strong> a few days before the
          deadline, only to the households who haven’t answered.
        </li>
        <li>
          <strong>Follow up personally</strong> the day after the deadline. A
          short message or call from you (or a parent who knows them) works far
          better than a second group email.
        </li>
        <li>
          <strong>Make a fair assumption</strong> if you still haven’t heard by
          your supplier deadline. Confirm with them directly if you can; if not,
          counting them as not attending is the usual default.
        </li>
      </ul>
      <p>
        The less effort a reply takes, the fewer you will have to chase. A reply
        a guest can send from their phone in a minute, for everyone in the
        household, gets answered on the day it arrives far more often than a
        card that needs a stamp.{" "}
        <a href="/wedding-rsvp">See how online RSVPs work in Vow Motion</a>.
      </p>
      <div className="content-note">
        <strong>In Vow Motion</strong>
        <p>
          Filter your guest list to “Awaiting reply” and send a reminder to just
          those households, without writing to everyone who has already
          answered.
        </p>
      </div>

      <h2>Questions couples ask</h2>
      <div className="content-faq">
        <details>
          <summary>Is two weeks before the wedding too late for RSVPs?</summary>
          <p>
            Usually, yes. It leaves no time to chase late replies before most
            caterers need final numbers. Three to four weeks is safer.
          </p>
        </details>
        <details>
          <summary>Should the RSVP deadline be on the invitation?</summary>
          <p>
            Yes, on the invitation or the reply card. Guests should see the date
            in the same place they reply.
          </p>
        </details>
        <details>
          <summary>Can I set a different deadline for different events?</summary>
          <p>
            You can, but one date for everything is easier for guests to
            remember. If a welcome dinner needs numbers sooner, set the single
            deadline early enough to cover it.
          </p>
        </details>
      </div>
    </ContentPage>
  );
}

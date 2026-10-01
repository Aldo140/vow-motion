import type { Metadata } from "next";
import ContentPage from "@/components/content-page";
import { features } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

const entry = features.find((f) => f.path === "/wedding-rsvp")!;

export const metadata: Metadata = pageMetadata({
  title: "Online wedding RSVP for every household and event",
  description:
    "Collect wedding RSVPs online: households reply for everyone at once, event by event, with meal choices, dietary needs and your own questions in one list.",
  path: entry.path,
  card: entry.card,
});

export default function Page() {
  return (
    <ContentPage
      entry={entry}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Online wedding RSVPs", path: entry.path },
      ]}
      kicker="Online wedding RSVP"
      title={
        <>
          Every reply, in one place.
          <em>Nobody chased twice.</em>
        </>
      }
      lede="Vow Motion collects RSVPs by household and by event, so one person can answer for the whole family in a minute, and you can see at a glance who is coming, what they’re eating and who still hasn’t replied."
      imageAlt="Wedding rings resting on an envelope beside a bouquet of garden roses"
      caption="A minute to reply. One list to read."
    >
      <h2>How guests reply</h2>
      <p>
        Each household opens its own invitation link, sees the names you added
        for them, and answers for each person and each event. Attending the
        ceremony but not the brunch? That is one tap, not an email thread.
      </p>
      <p>
        Guests can come back to the same link and change their answer up to
        your RSVP deadline, which is shown on the invitation so nobody has to
        guess. <a href="/guides/when-are-wedding-rsvps-due">How to choose
        your deadline</a>.
      </p>

      <h2>What you can ask</h2>
      <div className="content-features">
        <div>
          <h3>Attendance by event</h3>
          <p>
            Ceremony, reception, welcome drinks, a private family dinner: each
            event has its own reply and its own guest list.
          </p>
        </div>
        <div>
          <h3>Meals and dietary needs</h3>
          <p>
            Meal choices and dietary requirements are recorded per guest, so
            the kitchen gets names rather than guesses.
          </p>
        </div>
        <div>
          <h3>Plus-ones</h3>
          <p>
            Add a plus-one place to any household. Whoever replies fills in
            their guest’s name, and you see it in your list.
          </p>
        </div>
        <div>
          <h3>Your own questions</h3>
          <p>
            Add questions for the household or for each guest, shown only to
            those attending: song requests, shuttle seats, arrival dates.
          </p>
        </div>
      </div>

      <h2>What you see</h2>
      <p>
        Replies land in your Studio as they arrive, already tied to the right
        household. You can see totals for each event, filter to the guests who
        haven’t answered, and send a reminder to just those households instead
        of everyone.
      </p>
      <p>
        When it is time to hand numbers to your suppliers, export the guest and
        RSVP data as a spreadsheet. Planners can also generate a kitchen sheet,
        a shuttle manifest and place cards straight from the replies.{" "}
        <a href="/planners">More for wedding planners</a>.
      </p>
      <div className="content-note">
        <strong>Bringing an existing list?</strong>
        <p>
          Import guests from a CSV spreadsheet, map its columns, and review
          the households before anything is saved.
        </p>
      </div>

      <h2>Why online RSVPs get more answers</h2>
      <p>
        Reply cards get lost on the kitchen counter, and RSVPs by text or email
        end up scattered across inboxes. An online RSVP lives on the invitation
        itself, takes a minute on a phone, and gives you one reliable list,
        which matters most in the final fortnight when your caterer and venue
        want firm numbers.
      </p>

      <h2>Questions couples ask</h2>
      <div className="content-faq">
        <details>
          <summary>Can one person reply for the whole household?</summary>
          <p>
            Yes. Whoever opens the household’s invitation can answer for every
            guest listed on it, for every event they’re invited to.
          </p>
        </details>
        <details>
          <summary>Can guests change their RSVP?</summary>
          <p>
            Yes, from the same personal link, until the RSVP deadline you set.
          </p>
        </details>
        <details>
          <summary>Can guests add people who weren’t invited?</summary>
          <p>
            No. Guests reply for the names you added, plus a guest only where
            you’ve added a plus-one place, so your numbers stay yours.
          </p>
        </details>
        <details>
          <summary>Does it work alongside paper invitations?</summary>
          <p>
            Yes. Each household’s invitation has its own QR code, so you can
            print it on the card you post and collect every reply online.
          </p>
        </details>
      </div>
    </ContentPage>
  );
}

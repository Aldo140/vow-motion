import type { Metadata } from "next";
import ContentPage from "@/components/content-page";
import { features } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

const entry = features.find((f) => f.path === "/digital-wedding-invitations")!;

export const metadata: Metadata = pageMetadata({
  title: "Digital wedding invitations with household RSVPs",
  description:
    "Send a designed digital wedding invitation each household opens from its own private link, then collect replies, meals and dietary needs in one place.",
  path: entry.path,
  card: entry.card,
});

export default function Page() {
  return (
    <ContentPage
      entry={entry}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Digital wedding invitations", path: entry.path },
      ]}
      kicker="Digital wedding invitations"
      title={
        <>
          An invitation worth opening.
          <em>Sent with a link.</em>
        </>
      }
      lede="Vow Motion gives every household its own designed invitation, opened from a private link on any phone or laptop. Guests reply for everyone in the household, see only the events they are invited to, and keep the details with them until the day."
      imageAlt="A wedding invitation resting on folded silk"
      caption="The feeling of paper, without the post."
    >
      <h2>What your guests receive</h2>
      <p>
        Each household gets a personal link. When they open it, the invitation
        unfolds in the design you chose, with your names, your date and your
        words. There is no app to download and no account to create: it opens
        in the browser they already use.
      </p>
      <div className="content-features">
        <div>
          <h3>A private link per household</h3>
          <p>
            Every invitation is addressed to the household it was sent to, so
            the Smiths see “The Smith Family” and only their own guests.
          </p>
        </div>
        <div>
          <h3>One reply for everyone</h3>
          <p>
            Whoever opens the invitation can answer for the whole household,
            event by event, including meals and dietary needs.
          </p>
        </div>
        <div>
          <h3>Only the events they’re invited to</h3>
          <p>
            Keep a rehearsal dinner or a family brunch private. Households not
            invited to an event simply never see it.
          </p>
        </div>
        <div>
          <h3>Details that travel with them</h3>
          <p>
            Schedule, venues, dress code, travel and hotels stay on the
            invitation, and each event can be added to their calendar.
          </p>
        </div>
      </div>

      <h2>A design that feels like you</h2>
      <p>
        Choose from a collection of design worlds, each with its own palette,
        typography and ornament, from a Lake Como riviera to a Provençal
        maison. Your invitation is never a template with the names swapped: the
        wording, the photography and the order of the day are all yours to set.
      </p>
      <p>
        Before anything is sent, you can preview exactly what a guest will see
        and open the invitation as if you were one of them.
      </p>

      <h2>Replies, without the spreadsheet</h2>
      <p>
        Because every reply is tied to a household, you always know who has
        answered and who has not. Ask your own questions alongside the RSVP,
        such as song requests, shuttle seats or an allergy you need to know
        about, and send a gentle reminder to just the households still awaiting
        a reply. <a href="/wedding-rsvp">See how online RSVPs work</a>.
      </p>
      <div className="content-note">
        <strong>For bilingual weddings</strong>
        <p>
          Guests can read their invitation in English or Spanish, with event
          names and RSVP questions shown in their language.
        </p>
      </div>

      <h2>After the invitation</h2>
      <p>
        The same link stays useful all the way to the day. Guests return to it
        for the schedule and directions, find their table with a QR code at the
        venue, and share their photos afterwards in an album you approve.
      </p>

      <h2>How to send digital wedding invitations</h2>
      <ol>
        <li>
          <strong>Create your wedding</strong> with your names, date and
          location, and choose a design.
        </li>
        <li>
          <strong>Add your events</strong>: ceremony, reception and anything
          private, each with its own guest list.
        </li>
        <li>
          <strong>Bring in your guests</strong> by hand or from a CSV
          spreadsheet, grouped into households.
        </li>
        <li>
          <strong>Preview, then share</strong> each household’s personal link
          by email or however you usually reach them.
        </li>
      </ol>
      <p>
        Still deciding between paper and digital? Read our{" "}
        <a href="/guides/digital-vs-paper-wedding-invitations">
          honest comparison
        </a>
        , or get the words right first with our{" "}
        <a href="/guides/wedding-invitation-wording">
          invitation wording guide
        </a>
        .
      </p>

      <h2>Questions couples ask</h2>
      <div className="content-faq">
        <details>
          <summary>Do guests need an app or an account?</summary>
          <p>
            No. Each household opens its personal link in a browser on a phone,
            tablet or computer.
          </p>
        </details>
        <details>
          <summary>Can people forward the invitation to someone else?</summary>
          <p>
            Each link belongs to one household and shows only that
            household’s guests and events. If a link ends up in the wrong hands,
            replace it from your Studio and the old one stops working.
          </p>
        </details>
        <details>
          <summary>What does it cost?</summary>
          <p>
            The self-service tools, including invitations and RSVPs, are
            included at no charge in the current release. No card is required
            to create a wedding.
          </p>
        </details>
        <details>
          <summary>Can I still send paper invitations?</summary>
          <p>
            Yes. Many couples post a printed invitation and include the
            personal link for replies, events and travel details.
          </p>
        </details>
      </div>
    </ContentPage>
  );
}

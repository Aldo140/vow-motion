import type { Metadata } from "next";
import ContentPage from "@/components/content-page";
import { guides } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

const entry = guides.find(
  (g) => g.path === "/guides/digital-vs-paper-wedding-invitations",
)!;

export const metadata: Metadata = pageMetadata({
  title: "Digital vs paper wedding invitations: an honest comparison",
  description:
    "Digital or paper wedding invitations? Compare cost, timing, RSVPs, etiquette and keepsake value, and see when sending both makes the most sense.",
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
        { name: "Digital vs paper", path: entry.path },
      ]}
      kicker="Guide · Invitations"
      title={
        <>
          Digital vs paper
          <em>wedding invitations.</em>
        </>
      }
      lede="Paper is a keepsake. Digital is faster, cheaper and far better at collecting replies. Neither is the “proper” choice any more. Here is how they really compare, so you can choose for your guests rather than for convention."
      imageAlt="A long wedding table set under olive trees in a walled garden"
      caption="Choose for the people you’re inviting."
    >
      <h2>At a glance</h2>
      <div className="table-scroll">
        <table className="content-table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Paper</th>
              <th scope="col">Digital</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Cost</th>
              <td>Design, printing, envelopes and postage, per guest</td>
              <td>Little or nothing, regardless of guest count</td>
            </tr>
            <tr>
              <th scope="row">Lead time</th>
              <td>Weeks for proofs, printing and post</td>
              <td>Ready to send as soon as it is written</td>
            </tr>
            <tr>
              <th scope="row">Changes</th>
              <td>A reprint, or a correction card</td>
              <td>Edit once and every guest sees the update</td>
            </tr>
            <tr>
              <th scope="row">Replies</th>
              <td>Reply cards, collected and typed up by hand</td>
              <td>Collected online and counted for you</td>
            </tr>
            <tr>
              <th scope="row">Details</th>
              <td>Limited by what fits in the envelope</td>
              <td>Schedule, maps, travel and dress code in one place</td>
            </tr>
            <tr>
              <th scope="row">Keepsake</th>
              <td>Something to frame and hold</td>
              <td>Lives on as a link, not on the mantelpiece</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>The case for paper</h2>
      <p>
        A heavy card arriving in the post still feels like an occasion. It is
        something to put on the fridge, to frame afterwards, and to tuck into a
        wedding album. For grandparents and older relatives who don’t live on
        their phones, paper is also simply easier.
      </p>
      <p>
        Paper suits weddings where the invitation is part of the design story:
        letterpress, wax seals, hand-lettered envelopes. If that matters to you,
        it is worth the cost.
      </p>

      <h2>The case for digital</h2>
      <p>
        Digital invitations cost a fraction of paper, arrive the moment you
        send them, and never get lost in the post. The bigger advantage is what
        happens after they arrive: guests reply from the invitation itself, so
        you get answers faster and keep them in one list instead of a pile of
        cards.
      </p>
      <p>
        They also hold far more than paper can. A digital invitation can carry
        the full weekend schedule, venue maps, hotel suggestions and dress
        code, each event shown only to the guests invited to it, and let guests
        add every event to their calendar. If plans change, you edit them once.
      </p>

      <h2>Is it rude to send digital wedding invitations?</h2>
      <p>
        No. Digital invitations are now common, particularly for destination
        weddings, guests spread across countries, and couples planning on a
        shorter timeline. What makes an invitation feel personal is not the
        paper, it is being addressed by name, in a design that clearly took
        care. Avoid anything that looks like a mass email; a personal link for
        each household, sent with a short note in your own words, reads as an
        invitation rather than an announcement.
      </p>

      <h2>The best of both</h2>
      <p>
        Many couples now do both: a printed invitation posted to the people who
        will treasure it, with a link or QR code for replies and details, and a
        digital invitation for everyone else. You keep the keepsake and lose the
        reply cards.
      </p>
      <div className="content-note">
        <strong>In Vow Motion</strong>
        <p>
          Every household’s invitation has its own link and QR code, so you can
          print the code on a paper card and still collect every reply online.
        </p>
      </div>

      <h2>How to choose</h2>
      <ul>
        <li>
          <strong>Choose paper</strong> if the invitation is part of the design
          and budget allows, or most of your guests prefer post.
        </li>
        <li>
          <strong>Choose digital</strong> if guests are travelling, the timeline
          is short, plans are likely to change, or you want replies in one place
          without chasing.
        </li>
        <li>
          <strong>Choose both</strong> if you want a keepsake for close family
          and an easy reply for everyone.
        </li>
      </ul>
      <p>
        Whichever you choose, start with the words. Our{" "}
        <a href="/guides/wedding-invitation-wording">
          invitation wording guide
        </a>{" "}
        has examples for every style, and{" "}
        <a href="/digital-wedding-invitations">
          here is how Vow Motion invitations work
        </a>
        .
      </p>
    </ContentPage>
  );
}

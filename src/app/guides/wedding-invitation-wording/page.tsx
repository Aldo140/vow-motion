import type { Metadata } from "next";
import ContentPage from "@/components/content-page";
import { guides } from "@/lib/guides";
import { pageMetadata } from "@/lib/seo";

const entry = guides.find((g) => g.path === "/guides/wedding-invitation-wording")!;

export const metadata: Metadata = pageMetadata({
  title: "Wedding invitation wording: examples for every style",
  description:
    "What to write on a wedding invitation, in the right order, with wording examples for formal, relaxed, family-hosted, adults-only and destination weddings.",
  path: entry.path,
  card: entry.card,
});

function Wording({ label, children }: { label: string; children: string }) {
  return (
    <div className="wording-card">
      <small>{label}</small>
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <ContentPage
      article
      actions={false}
      entry={entry}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: "Invitation wording", path: entry.path },
      ]}
      kicker="Guide · Invitations"
      title={
        <>
          Wedding invitation wording,
          <em>with examples.</em>
        </>
      }
      lede="The words on an invitation do two jobs: they set the tone of the day, and they tell guests exactly where to be. Here is what to include, the order it traditionally goes in, and wording you can borrow for every kind of wedding."
      imageAlt="A stone house with green shutters behind a garden fountain"
      caption="Say it simply. Say it like you."
    >
      <nav className="content-toc" aria-label="On this page">
        <strong>On this page</strong>
        <ol>
          <li>
            <a href="#what-to-include">What every invitation includes</a>
          </li>
          <li>
            <a href="#formal">Formal wording</a>
          </li>
          <li>
            <a href="#relaxed">Relaxed and modern wording</a>
          </li>
          <li>
            <a href="#hosts">When parents or families are hosting</a>
          </li>
          <li>
            <a href="#adults-only">Adults-only and other delicate notes</a>
          </li>
          <li>
            <a href="#destination">Destination and weekend weddings</a>
          </li>
          <li>
            <a href="#digital">Wording for a digital invitation</a>
          </li>
        </ol>
      </nav>

      <h2 id="what-to-include">What every wedding invitation includes</h2>
      <p>
        Whatever the style, the information runs in roughly the same order, from
        who is inviting to what happens afterwards:
      </p>
      <ol>
        <li>
          <strong>The hosts</strong>: whoever is issuing the invitation. Today
          that is usually the couple, but it may be one or both families.
        </li>
        <li>
          <strong>The request line</strong>: “request the pleasure of your
          company”, “invite you to celebrate” or something warmer in your own
          voice.
        </li>
        <li>
          <strong>The couple’s names</strong>, traditionally with the bride’s
          first, though any order is fine. Use the names your guests know you
          by.
        </li>
        <li>
          <strong>The date and time</strong>, written out in full on formal
          invitations (“Saturday, the twelfth of June”).
        </li>
        <li>
          <strong>The venue and town</strong>. The full street address can live
          on a details card or your wedding website.
        </li>
        <li>
          <strong>What follows</strong>: “Reception to follow” or “Dinner and
          dancing to follow”, so guests know to plan for the evening.
        </li>
        <li>
          <strong>How to reply</strong>, and by when. See our guide to{" "}
          <a href="/guides/when-are-wedding-rsvps-due">
            choosing an RSVP deadline
          </a>
          .
        </li>
      </ol>
      <p>
        Dress code, accommodation, registry and transport rarely fit gracefully
        on the invitation itself. Put them on a separate card or, more simply,
        on the page your guests reply from.
      </p>

      <h2 id="formal">Formal wedding invitation wording</h2>
      <p>
        Formal wording is written in the third person, spells out numbers and
        avoids abbreviations. “The honour of your presence” is traditionally
        reserved for ceremonies held in a place of worship; “the pleasure of
        your company” is used everywhere else.
      </p>
      <Wording label="Formal, hosted by the couple">
        {`Elena Rossi
and
Matteo Bianchi
request the pleasure of your company
at their marriage
Saturday, the twelfth of June
two thousand twenty-seven
at four o’clock in the afternoon
Villa Carlotta
Tremezzo, Lake Como

Dinner and dancing to follow`}
      </Wording>
      <Wording label="Formal, religious ceremony">
        {`The honour of your presence is requested
at the marriage of
Sophie Tremblay
and
James Okafor
Saturday, the fourth of September
at half past two o’clock
St. Andrew’s Church
Halifax, Nova Scotia`}
      </Wording>

      <h2 id="relaxed">Relaxed and modern wording</h2>
      <p>
        If your day is closer to a long lunch than a ballroom, let the wording
        say so. First person is fine, numerals are fine, and a little humour is
        fine, provided the practical details are still impossible to miss.
      </p>
      <Wording label="Relaxed">
        {`Together with our families,
Priya & Daniel
are getting married!

Join us for vows, dinner and a very long dance
Saturday, June 12, 2027 at 4 pm
The Orchard, Kelowna`}
      </Wording>
      <Wording label="Short and modern">
        {`We’re getting married.
Come celebrate with us.

Sam & Jordan
06.12.2027 · Toronto`}
      </Wording>

      <h2 id="hosts">When parents or families are hosting</h2>
      <p>
        Traditionally the hosts’ names come first, followed by the couple. When
        both families are contributing, or when you simply want to include
        them, there are graceful ways to say so.
      </p>
      <Wording label="The bride’s parents hosting">
        {`Mr. and Mrs. Robert Chen
request the pleasure of your company
at the marriage of their daughter
Grace
to
Oliver Martin`}
      </Wording>
      <Wording label="Both families">
        {`Together with their families
Grace Chen
and
Oliver Martin
invite you to celebrate their marriage`}
      </Wording>
      <p>
        For divorced or remarried parents, list each hosting parent on their own
        line. If a parent has passed away and you would like to honour them,
        “daughter of Anna and the late Thomas Reid” is a gentle, widely used
        form.
      </p>

      <h2 id="adults-only">Adults-only and other delicate notes</h2>
      <p>
        The envelope (or the names on a digital invitation) is the clearest way
        to say who is invited: only the people named are included. A short,
        kind line on the details card or RSVP page helps where it may not be
        obvious.
      </p>
      <ul>
        <li>
          <strong>Adults only:</strong> “We love your little ones, but our
          celebration will be adults only.”
        </li>
        <li>
          <strong>No plus-ones:</strong> “We have reserved one seat in your
          honour.” Then make sure the invitation shows only that one name.
        </li>
        <li>
          <strong>Unplugged ceremony:</strong> “We invite you to be fully
          present with us: phones away during the ceremony, please.”
        </li>
        <li>
          <strong>Gifts:</strong> leave registry details off the invitation
          itself and link them from your wedding website instead.
        </li>
      </ul>
      <div className="content-note">
        <strong>In Vow Motion</strong>
        <p>
          Each household’s invitation lists only the guests you added for them,
          so “adults only” and “no plus-ones” are built in rather than asked
          for.
        </p>
      </div>

      <h2 id="destination">Destination and weekend weddings</h2>
      <p>
        For a wedding guests must travel to, the invitation carries the main
        event, while a schedule of the whole weekend belongs on its own card or
        page. Send a save-the-date well before the invitation so guests can
        book flights.
      </p>
      <Wording label="Destination">
        {`Please join us in Provence
for the wedding of
Claire & Thomas

Friday 3 to Sunday 5 September 2027
Ceremony on Saturday at five o’clock
Château de Sainte-Croix

Weekend schedule and travel details enclosed`}
      </Wording>

      <h2 id="digital">Wording for a digital invitation</h2>
      <p>
        Digital invitations can carry the same formal wording as paper; the
        difference is everything that sits around it. Instead of a stack of
        enclosure cards, the schedule, venue map, dress code, travel and RSVP
        all live one tap away. That lets the invitation itself stay short and
        beautiful.
      </p>
      <p>
        If you are sending the link by email or message, add a brief personal
        note in the message itself (“We would love you there. Your invitation
        is below.”) so it does not read like an automated email.
      </p>
      <p>
        Weighing up the two? Read{" "}
        <a href="/guides/digital-vs-paper-wedding-invitations">
          digital vs paper wedding invitations
        </a>
        , or see{" "}
        <a href="/digital-wedding-invitations">
          how Vow Motion invitations work
        </a>
        .
      </p>
    </ContentPage>
  );
}

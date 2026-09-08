import { Arrow } from "./ui";

// This route creates a private demo and redirects; use a full navigation.
const guestPreview = "/demo/riviera";

export function FirstSteps({ planner = false }: { planner?: boolean }) {
  const steps = planner
    ? [
        [
          "Open a guest invitation",
          "Try the opening, household RSVP and event details with sample guests. No signup needed.",
        ],
        [
          "Try the work behind it",
          "Open a private Studio demo. Change a design, explore the guest list and see how the pieces connect.",
        ],
        [
          "Decide where it fits",
          "Evaluate one wedding before changing your process. Check the guest experience and the work it takes to maintain it.",
        ],
      ]
    : [
        [
          "Find your feeling",
          "Explore six design worlds and open a working invitation before you create an account.",
        ],
        [
          "Make it yours",
          "Add your names, date and events. See your invitation take shape as you go.",
        ],
        [
          "Share when you are ready",
          "Add your households, check what each one will see, then share their personal invitations.",
        ],
      ];
  return (
    <section className="offer-section" aria-labelledby="first-steps-heading">
      <p className="collection-caption">A small first step</p>
      <h2 id="first-steps-heading">
        {planner
          ? "See the fit before the commitment."
          : "From a first look to your first invitation."}
      </h2>
      {!planner && (
        <div className="invitation-editorial" aria-hidden="true">
          <figure className="editorial-print editorial-setting depth-drift">
            <img src="/images/heritage.webp" alt="" loading="lazy" />
            <figcaption>The place.</figcaption>
          </figure>
          <div className="editorial-letter depth-drift">
            <span className="editorial-monogram">
              V <i>&amp;</i> M
            </span>
            <span>A note for your favourite people.</span>
            <strong>
              Come for the love.
              <br />
              <i>Stay for the memories.</i>
            </strong>
            <span className="editorial-rule" />
            <small>THE BEGINNING OF SOMETHING BEAUTIFUL</small>
          </div>
          <figure className="editorial-print editorial-evening depth-drift">
            <img src="/images/wedding-evening.webp" alt="" loading="lazy" />
            <figcaption>The people. The feeling.</figcaption>
          </figure>
          <img
            className="editorial-ribbon"
            src="/images/invitation-silk.webp"
            alt=""
            loading="lazy"
          />
        </div>
      )}
      <ol className="offer-steps">
        {steps.map(([title, copy], index) => (
          <li key={title}>
            <span className="offer-step-number" aria-hidden="true">
              0{index + 1}
            </span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </li>
        ))}
      </ol>
      <a href={guestPreview} className="text-link">
        Try a guest invitation <Arrow diagonal />
      </a>
      <p className="offer-note">
        Sample wedding. Working RSVP. No real guests contacted.
      </p>
    </section>
  );
}

export function OfferQuestions({ planner = false }: { planner?: boolean }) {
  const questions = [
    ...(planner
      ? [
          [
            "We already use planning software. Where would this fit?",
            "Start by comparing the guest experience with what you already offer. Vow Motion focuses on a coordinated invitation design, household replies and wedding details, with a small team building alongside planners. We do not currently integrate directly with Aisle Planner or Planning Pod. Guest data can be imported and exported by CSV, but changes do not automatically sync between systems. If it duplicates work without adding value, it may not be the right fit.",
          ],
        ]
      : []),
    [
      "What does it cost?",
      "The wedding tools shown here are included at no charge in the current release. No card is required. This describes the current release, not a promise of lifetime pricing.",
    ],
    [
      "Can I try it before creating an account?",
      "Yes. Open any guest invitation demo without signing up. The planner Studio demo also uses sample weddings you can explore and edit. Demo actions do not contact real guests. Create an account when you want a wedding of your own.",
    ],
    [
      "Do guests need an app or an account?",
      "No. Each household opens its personal invitation link in a browser. Guests can respond for their household and see the events they are invited to.",
    ],
    [
      "How much do I need ready to get started?",
      "Start with your names and the details you know. Choose a design, add events and build your guest list as plans come together. Setup guidance and a design preview help you review your work before sharing invitations.",
    ],
    [
      "Can I bring my guest list and take it with me?",
      "Yes. Import a CSV spreadsheet, map its columns and review households before saving. You can export guest and RSVP data from Studio as your plans develop.",
    ],
  ];
  return (
    <section
      className="offer-section offer-faq"
      aria-labelledby="offer-faq-heading"
    >
      <div>
        <p className="collection-caption">Before you begin</p>
        <h2 id="offer-faq-heading">A few things you might be wondering.</h2>
        <p className="offer-note">
          A clear picture, before you make room for something new.
        </p>
      </div>
      <div className="offer-questions">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

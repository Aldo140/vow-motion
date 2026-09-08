import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  CalendarDotsIcon,
  CheckIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";

function PhoneFrame({
  className,
  children,
  label,
}: {
  className: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className={`journey-phone ${className}`}>
      <span className="journey-phone-speaker" aria-hidden="true" />
      <div className="journey-phone-screen" aria-label={label}>
        {children}
      </div>
      <span className="phone-stage-label">
        {className.includes("invite")
          ? "01 / The invitation"
          : "02 / The reply"}
      </span>
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <section
      id="experience"
      className="product-showcase guest-preview-stage section-pad"
      aria-labelledby="journey-title"
      tabIndex={-1}
    >
      <div className="journey-heading">
        <p className="collection-caption">
          A personal welcome. An effortless reply.
        </p>
        <h2 id="journey-title">
          <span>Made to be opened.</span>
          <em>Easy to say yes to.</em>
        </h2>
        <p>
          An invitation with their names on it. Only the events meant for them.
          One thoughtful reply for everyone in their household.
        </p>
        <Link prefetch={false} href="/demo/riviera" className="text-link">
          Try the RSVP yourself <ArrowUpRightIcon size={17} />
        </Link>
      </div>

      <div
        className="journey-collage"
        aria-label="Sample invitation and household event details"
      >
        <div className="journey-playing" aria-hidden="true">
          SAMPLE WEDDING / ELENA &amp; MATTEO
        </div>
        <div className="journey-photo journey-photo-primary">
          <Image
            src="/images/hero-riviera.webp"
            alt="A sample destination wedding setting"
            fill
            sizes="(max-width: 760px) 75vw, 34vw"
          />
        </div>

        <div
          className="journey-phone-pair"
          tabIndex={0}
          role="group"
          aria-label="Invitation and RSVP previews. Scroll horizontally to explore on mobile."
        >
          <PhoneFrame
            className="journey-phone-invite"
            label="Personal invitation preview"
          >
            <div className="phone-invitation">
              <small>YOU ARE JOYFULLY INVITED</small>
              <div className="phone-monogram">
                E <i>&amp;</i> M
              </div>
              <h3>
                Elena
                <i>&amp;</i>
                Matteo
              </h3>
              <p>19 · 06 · 27</p>
              <span className="phone-open">
                Open your invitation <i aria-hidden="true">→</i>
              </span>
            </div>
          </PhoneFrame>

          <PhoneFrame
            className="journey-phone-events"
            label="Household event details preview"
          >
            <div className="phone-events">
              <div className="phone-events-hero">
                <Image
                  src="/images/wedding-details.webp"
                  alt=""
                  fill
                  sizes="220px"
                />
                <span>YOUR WEEKEND</span>
                <h3>Made for your household.</h3>
              </div>
              <div className="phone-event-row">
                <CalendarDotsIcon size={15} />
                <div>
                  <b>Welcome dinner</b>
                  <small>Friday · 7:00 PM</small>
                </div>
                <span className="phone-event-answer">Going</span>
              </div>
              <div className="phone-event-row">
                <MapPinIcon size={15} />
                <div>
                  <b>The ceremony</b>
                  <small>Villa Balbianello</small>
                </div>
                <span className="phone-event-answer phone-event-answer-late">
                  Going
                </span>
              </div>
              <div className="phone-meal-question">
                <span>DINNER</span>
                <b>Choose a meal</b>
                <div>
                  <i>Garden</i>
                  <i className="phone-meal-selected">
                    Seabass <CheckIcon size={9} weight="bold" />
                  </i>
                </div>
              </div>
            </div>
          </PhoneFrame>
        </div>
        <p className="phone-gallery-hint">
          Swipe to explore the invitation and reply{" "}
          <span aria-hidden="true">&harr;</span>
        </p>
      </div>
    </section>
  );
}

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
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <section
      id="experience"
      className="product-showcase section-pad"
      aria-labelledby="journey-title"
      tabIndex={-1}
    >
      <div className="journey-heading">
        <p className="collection-caption">What your guests actually receive</p>
        <h2 id="journey-title">
          From the first tap
          <br />
          <em>to the final yes.</em>
        </h2>
        <p>
          One private link opens into their invitation, their events, and a
          reply made for their household.
        </p>
        <Link href="/demo/riviera" className="text-link">
          Try the RSVP yourself <ArrowUpRightIcon size={17} />
        </Link>
      </div>

      <div
        className="journey-collage"
        role="img"
        aria-label="An animated preview of the guest experience"
      >
        <div className="journey-playing" aria-hidden="true">
          <span /> Live guest preview
        </div>
        <div className="journey-photo journey-photo-primary">
          <Image
            src="/images/hero-riviera.webp"
            alt="A sample destination wedding setting"
            fill
            sizes="(max-width: 760px) 75vw, 34vw"
          />
          <span>Lake Como, 19 June 2027</span>
        </div>

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

        <div className="journey-reply-card">
          <span className="journey-check">
            <CheckIcon size={20} weight="bold" />
          </span>
          <small>REPLY RECEIVED</small>
          <h3>We’ll be there.</h3>
          <p>Sophie and James are attending the ceremony and dinner.</p>
          <span className="journey-synced">
            <i aria-hidden="true" /> Synced to your Studio
          </span>
        </div>

        <div className="journey-seal" aria-hidden="true">
          V<i>&amp;</i>M
        </div>
        <p className="journey-handnote" aria-hidden="true">
          Personal to every guest.
          <br />
          Easy for everyone.
        </p>
      </div>

      <div className="journey-steps" aria-label="The guest journey">
        <div>
          <span>01</span>
          <b>They open</b>
          <p>A beautiful invitation, addressed to them.</p>
        </div>
        <div>
          <span>02</span>
          <b>They know</b>
          <p>Only the events and details meant for their household.</p>
        </div>
        <div>
          <span>03</span>
          <b>They reply</b>
          <p>Attendance, meals and notes arrive organized in your Studio.</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRightIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
} from "@phosphor-icons/react";

function Demonstration({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="product-film" data-playing={visible && !paused}>
      <div className="product-film-art" role="img" aria-label={label}>
        {children}
      </div>
      <div className="product-film-footer">
        <span>Illustrative preview · Sample wedding</span>
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          aria-label={`${paused ? "Play" : "Pause"} ${label}`}
        >
          {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </div>
  );
}

export default function ProductShowcase() {
  return (
    <div className="product-showcase" id="experience" tabIndex={-1}>
      <section
        className="product-feature product-feature-invitation"
        aria-labelledby="invitation-feature-title"
      >
        <div className="product-feature-inner">
          <div className="product-feature-copy">
            <p className="product-feature-kicker">
              01 / Make the first impression
            </p>
            <h2 id="invitation-feature-title">
              An invitation that feels like <em>your wedding.</em>
            </h2>
            <p>
              Your names. Your setting. Your kind of celebration. Give guests a
              personal invitation that opens into everything they need for the
              day.
            </p>
            <Link
              href="/demo/riviera"
              prefetch={false}
              className="product-feature-link"
            >
              Open a sample invitation <ArrowUpRightIcon size={18} />
            </Link>
            <small>No signup needed. Try it as a guest.</small>
          </div>
          <Demonstration label="Invitation opening into a wedding website">
            <div className="invitation-scene">
              <Image
                src="/images/hero-riviera.webp"
                alt=""
                fill
                sizes="(max-width: 800px) 100vw, 600px"
              />
              <div className="invitation-reveal">
                <span>TOGETHER WITH OUR FAMILIES</span>
                <h3>
                  Elena <i>&amp;</i> Matteo
                </h3>
                <p>Lake Como · 19 June 2027</p>
                <div className="invitation-detail">
                  A weekend to remember
                  <br />
                  <b>Welcome dinner · Ceremony · Celebration</b>
                </div>
              </div>
              <div className="invitation-envelope">
                <div className="invitation-flap" />
                <span>For Sophie &amp; James</span>
                <b className="invitation-wax">E &amp; M</b>
                <small>Something wonderful is waiting.</small>
              </div>
            </div>
          </Demonstration>
        </div>
      </section>
      <section
        className="product-feature product-feature-rsvp"
        aria-labelledby="rsvp-feature-title"
      >
        <div className="product-feature-inner">
          <div className="product-feature-copy">
            <p className="product-feature-kicker">02 / Make replying easy</p>
            <h2 id="rsvp-feature-title">
              One reply for <em>the whole household.</em>
            </h2>
            <p>
              Guests see the events they are invited to and reply for everyone
              in their party. Attendance, meal choices and dietary needs all
              come back together.
            </p>
            <Link
              href="/demo/riviera"
              prefetch={false}
              className="product-feature-link"
            >
              Try the guest RSVP <ArrowUpRightIcon size={18} />
            </Link>
            <small>Sample guests. No real invitations sent.</small>
          </div>
          <Demonstration label="Household attendance and meal selections">
            <div className="rsvp-preview">
              <div className="preview-masthead">
                ELENA &amp; MATTEO <span>YOUR REPLY</span>
              </div>
              <h3>We saved you a place.</h3>
              <p>Sophie &amp; James, will you join us?</p>
              <div className="preview-event">
                <div>
                  <b>Welcome dinner</b>
                  <small>Friday · 7:00 PM</small>
                </div>
                <span className="preview-choice choice-first">
                  <CheckIcon size={14} /> Attending
                </span>
              </div>
              <div className="preview-event">
                <div>
                  <b>The wedding</b>
                  <small>Saturday · 4:00 PM</small>
                </div>
                <span className="preview-choice choice-second">
                  <CheckIcon size={14} /> Attending
                </span>
              </div>
              <div className="preview-meal">
                <span>SOPHIE’S MEAL</span>
                <div>
                  <b className="meal-choice">
                    Garden risotto <CheckIcon size={14} />
                  </b>
                  <b>Roasted seabass</b>
                </div>
              </div>
              <div className="preview-diet">
                <span>DIETARY NOTES</span>
                <p>One vegetarian meal, please.</p>
              </div>
              <div className="preview-submit">
                <span>Send our reply</span>
                <b>
                  <CheckIcon size={16} /> Your reply is saved
                </b>
              </div>
            </div>
          </Demonstration>
        </div>
      </section>
      <section
        className="product-feature product-feature-studio"
        aria-labelledby="studio-feature-title"
      >
        <div className="product-feature-inner">
          <div className="product-feature-copy">
            <p className="product-feature-kicker">
              03 / Keep the details together
            </p>
            <h2 id="studio-feature-title">
              Every answer, <em>already organized.</em>
            </h2>
            <p>
              See who is coming, what they are eating and what still needs a
              reply. Your guest list keeps the details together, ready for you
              and your planner.
            </p>
            <a href="/planners" className="product-feature-link">
              Explore the planner experience <ArrowUpRightIcon size={18} />
            </a>
            <small>Built around the guests behind every row.</small>
          </div>
          <Demonstration label="Guest replies arriving in the planner Studio">
            <div className="studio-preview">
              <div className="preview-masthead">
                VOW MOTION <span>STUDIO</span>
              </div>
              <div className="studio-preview-title">
                <h3>Your guest list</h3>
                <span>Elena &amp; Matteo</span>
              </div>
              <div className="studio-preview-stats">
                <div>
                  <b>48</b>
                  <span>Invited</span>
                </div>
                <div>
                  <b>36</b>
                  <span>Attending</span>
                </div>
                <div>
                  <b>10</b>
                  <span>Awaiting reply</span>
                </div>
              </div>
              <div className="studio-preview-table">
                <div className="studio-preview-columns">
                  <span>HOUSEHOLD</span>
                  <span>REPLY</span>
                  <span>MEALS</span>
                </div>
                <div>
                  <b>Olivia &amp; Noah</b>
                  <span className="studio-status">Attending</span>
                  <span>2 received</span>
                </div>
                <div className="studio-arriving-row">
                  <b>Sophie &amp; James</b>
                  <span className="studio-status">Attending</span>
                  <span>2 received</span>
                </div>
                <div>
                  <b>Charlotte Rose</b>
                  <span>Awaiting reply</span>
                  <span>—</span>
                </div>
              </div>
              <div className="studio-response-note">
                <CheckIcon size={18} />
                <div>
                  <b>Sophie &amp; James replied</b>
                  <span>2 attending · 1 vegetarian meal</span>
                </div>
              </div>
            </div>
          </Demonstration>
        </div>
      </section>
    </div>
  );
}

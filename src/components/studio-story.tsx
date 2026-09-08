"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function StudioStory() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const sequence = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: ".reply-to-studio",
            start: "top 85%",
            end: "bottom 55%",
            scrub: true,
          },
        });
        sequence
          .from(".studio-reply-slip", { y: 36, rotation: -5, duration: 0.4 })
          .from(
            ".reply-connection path",
            { strokeDashoffset: 1, duration: 0.4 },
            0.15,
          )
          .from(
            ".ledger-new-reply",
            { opacity: 0.2, x: -12, duration: 0.35 },
            0.45,
          )
          .from(
            ".ledger-confirmation",
            { opacity: 0, y: 12, duration: 0.3 },
            0.7,
          );
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section
      className="studio-story"
      id="studio"
      ref={root}
      aria-labelledby="studio-story-title"
    >
      <div className="studio-story-heading">
        <div>
          <p className="studio-story-kicker">
            BEHIND EVERY BEAUTIFUL CELEBRATION
          </p>
          <h2 id="studio-story-title">
            Their yes.
            <br />
            <em>Your peace of mind.</em>
          </h2>
        </div>
        <div className="studio-story-intro">
          <p>
            A reply is more than a tick on a list. It is a place at the table, a
            meal to remember, one less detail on your mind.
          </p>
          <a href="/planners">
            See the work behind the magic <ArrowUpRightIcon size={18} />
          </a>
        </div>
      </div>
      <div
        className="reply-to-studio"
        role="img"
        aria-label="Illustrative sample: Sophie and James confirm attendance and their meal choices, and their household reply appears in the wedding Studio"
      >
        <div className="studio-reply-slip">
          <span className="reply-slip-top">A LITTLE REPLY FROM</span>
          <p>Sophie &amp; James</p>
          <span className="reply-slip-check">
            <CheckIcon size={22} />
          </span>
          <h3>
            We wouldn’t
            <br />
            <i>miss it.</i>
          </h3>
          <div className="reply-slip-details">
            <span>
              THE CEREMONY <b>2 attending</b>
            </span>
            <span>
              DINNER <b>1 vegetarian meal</b>
            </span>
          </div>
          <small>With love, see you there.</small>
        </div>
        <svg
          className="reply-connection"
          viewBox="0 0 120 80"
          fill="none"
          aria-hidden="true"
        >
          <path
            pathLength="1"
            d="M0 55C35 55 24 10 63 20S85 55 115 28M105 27L115 28L112 39"
          />
        </svg>
        <div className="wedding-ledger">
          <div className="ledger-chrome">
            <span>
              VOW MOTION <i>/</i> STUDIO
            </span>
            <span className="ledger-avatar">E &amp; M</span>
          </div>
          <div className="ledger-content">
            <div className="ledger-title">
              <div>
                <small>ELENA &amp; MATTEO</small>
                <h3>A place for everyone.</h3>
              </div>
              <span>GUEST LIST</span>
            </div>
            <div className="ledger-totals">
              <div>
                <b>48</b>
                <span>Invited</span>
              </div>
              <div>
                <b>38</b>
                <span>Attending</span>
              </div>
              <div>
                <b>8</b>
                <span>Awaiting reply</span>
              </div>
              <div>
                <b>2</b>
                <span>Declined</span>
              </div>
            </div>
            <div className="ledger-table">
              <div className="ledger-column-labels">
                <span>YOUR PEOPLE</span>
                <span>THEIR REPLY</span>
                <span>MEALS</span>
              </div>
              <div>
                <span>
                  <i>ON</i>
                  <b>Olivia &amp; Noah</b>
                </span>
                <span className="ledger-attending">Attending</span>
                <span>2 received</span>
              </div>
              <div className="ledger-new-reply">
                <span>
                  <i>SJ</i>
                  <b>Sophie &amp; James</b>
                </span>
                <span className="ledger-attending">
                  <CheckIcon size={12} /> Attending
                </span>
                <span>2 received</span>
              </div>
              <div>
                <span>
                  <i>CR</i>
                  <b>Charlotte Rose</b>
                </span>
                <span>Awaiting reply</span>
                <span>—</span>
              </div>
            </div>
            <div className="ledger-confirmation">
              <CheckIcon size={18} />
              <div>
                <b>One more household, all taken care of.</b>
                <span>Attendance and meal choices saved together.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="studio-story-bottom">
        <span>ILLUSTRATIVE PREVIEW / SAMPLE WEDDING</span>
        <p>
          From their invitation to your guest list.
          <br />
          <em>Every answer finds its place.</em>
        </p>
        <span>EXPLORE AS YOU SCROLL ↓</span>
      </div>
    </section>
  );
}

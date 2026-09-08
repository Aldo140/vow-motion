"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react";
gsap.registerPlugin(useGSAP, ScrollTrigger);
function Demonstration({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="product-film">
      <div className="product-film-art" role="img" aria-label={label}>
        {children}
      </div>
      <div className="product-film-footer">
        <span>Illustrative preview / Sample wedding</span>
        <span>Scroll to explore</span>
      </div>
    </div>
  );
}
export default function ProductStory({
  variant,
}: {
  variant: "invitation" | "studio";
}) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({
          scrollTrigger:
            variant === "invitation"
              ? {
                  trigger: root.current?.querySelector(".product-film-art"),
                  start: "center center",
                  toggleActions: "play none none none",
                  once: true,
                }
              : {
                  trigger: root.current?.querySelector(".product-film"),
                  start: "top 85%",
                  end: "bottom 55%",
                  scrub: true,
                },
          defaults: {
            ease: variant === "invitation" ? "power2.inOut" : "none",
          },
        });
        if (variant === "invitation") {
          timeline
            .to(".invitation-flap", {
              rotationX: 150,
              transformOrigin: "top",
              duration: 0.45,
            })
            .to(
              ".invitation-wax",
              { scale: 0.8, opacity: 0, duration: 0.15 },
              0,
            )
            .to(
              ".film-invitation-envelope",
              { yPercent: 105, duration: 0.85 },
              0.35,
            )
            .from(".invitation-reveal", { scale: 0.94, duration: 0.8 }, 0.35);
        } else {
          timeline
            .from(".studio-arriving-row", {
              opacity: 0.15,
              x: -18,
              duration: 0.5,
            })
            .from(
              ".studio-response-note",
              { opacity: 0, y: 18, duration: 0.35 },
              0.45,
            );
        }
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [variant] },
  );
  return (
    <div
      ref={root}
      className="product-story"
      id={variant === "studio" ? "studio" : undefined}
    >
      {variant === "invitation" ? (
        <>
          {" "}
          <section
            className="product-feature product-feature-invitation"
            aria-labelledby="invitation-feature-title"
          >
            <div className="product-feature-inner">
              <div className="product-feature-copy">
                <p className="product-feature-kicker">The first impression</p>
                <h2 id="invitation-feature-title">
                  An invitation that feels like <em>your wedding.</em>
                </h2>
                <p>
                  Your names. Your setting. Your kind of celebration. Give
                  guests a personal invitation that opens into everything they
                  need for the day.
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
                  <div className="film-invitation-envelope">
                    <div className="invitation-flap" />
                    <span>For Sophie &amp; James</span>
                    <b className="invitation-wax">E &amp; M</b>
                    <small>Something wonderful is waiting.</small>
                  </div>
                </div>
              </Demonstration>
            </div>
          </section>
        </>
      ) : (
        <>
          {" "}
          <section
            className="product-feature product-feature-studio"
            aria-labelledby="studio-feature-title"
          >
            <div className="product-feature-inner">
              <div className="product-feature-copy">
                <p className="product-feature-kicker">Behind the celebration</p>
                <h2 id="studio-feature-title">
                  Every answer, <em>already organized.</em>
                </h2>
                <p>
                  See who is coming, what they are eating and what still needs a
                  reply. Your guest list keeps the details together, ready for
                  you and your planner.
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
        </>
      )}
    </div>
  );
}

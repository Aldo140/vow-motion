"use client";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import MarketingNavigation from "./marketing-navigation";
import BrandExplainer from "./composition/explainer";
import BrandAd from "./composition/ad";
import type { CompositionHandle } from "./composition/runtime";
import { Brand, Arrow, DemoButton } from "./ui";
import { worlds } from "@/lib/worlds";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* Ambient light: each section's background and text colour track whatever the
   composition beside it is actually showing at that instant, the way a bias
   light behind a screen picks up its colour. The compositions render entirely
   in inline styles (composition/*-scene.tsx) and expose no colour of their
   own, so each section derives an approximate colour from the same authored
   cue points the scene itself uses — mirroring, not guessing, what's on
   screen. Cue seconds below are the cumulative scene durations from
   EXPLAINER_SCENES / AD_SCENES; they only need updating if those change. */

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (T: number, start: number, dur: number) =>
  clamp01((T - start) / dur);

type RGB = [number, number, number];
const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
};
const lerpRgb = (a: RGB, b: RGB, t: number): RGB => {
  const k = clamp01(t);
  return [0, 1, 2].map((i) =>
    Math.round(a[i] + (b[i] - a[i]) * k),
  ) as RGB;
};
const mixHex = (a: string, b: string, t: number) => lerpRgb(hexToRgb(a), hexToRgb(b), t);
const rgbStr = ([r, g, b]: RGB) => `rgb(${r} ${g} ${b})`;
const rgbaStr = ([r, g, b]: RGB, a: number) => `rgb(${r} ${g} ${b} / ${a})`;
// A brighter, more saturated read of a colour, for the glow it casts — the
// way a bright, colourful frame throws more visible light than a pale one.
const vivid = (c: RGB, boost = 1.5): RGB =>
  c.map((v) => Math.max(0, Math.min(255, Math.round(128 + (v - 128) * boost)))) as RGB;

type Ambient = { bg: RGB; ink: RGB; muted: RGB };

function applyAmbient(el: HTMLElement | null, a: Ambient) {
  if (!el) return;
  el.style.backgroundColor = rgbStr(a.bg);
  el.style.color = rgbStr(a.ink);
  el.style.setProperty("--xp-muted-ambient", rgbStr(a.muted));
  el.style.setProperty("--xp-glow", rgbaStr(vivid(a.bg), 0.6));
  el.style.setProperty("--xp-glow-soft", rgbaStr(vivid(a.bg), 0.32));
}

type Stop = { t: number; bg: string; muted: string; ink?: string };

/** Samples a cyclic list of authored colour stops at second T (0..total),
    interpolating between neighbours and wrapping the last stop back to the
    first. Stops carry the accent colour actually present in that beat of the
    film (a wax seal, a reply card, a world's palette) — pulled forward as
    ambient light, the way a screen's bias light reads its edge colours rather
    than an average grey. */
function sampleStops(T: number, stops: Stop[], total: number): Ambient {
  const n = stops.length;
  for (let i = 0; i < n; i++) {
    const cur = stops[i];
    const next = stops[(i + 1) % n];
    const nextT = i === n - 1 ? total : next.t;
    if (T >= cur.t && T < nextT) {
      const k = (T - cur.t) / (nextT - cur.t || 1e-6);
      return {
        bg: mixHex(cur.bg, next.bg, k),
        muted: mixHex(cur.muted, next.muted, k),
        ink: mixHex(cur.ink ?? "#1d1b17", next.ink ?? "#1d1b17", k),
      };
    }
  }
  return {
    bg: hexToRgb(stops[0].bg),
    muted: hexToRgb(stops[0].muted),
    ink: hexToRgb(stops[0].ink ?? "#1d1b17"),
  };
}

// The explainer's own accents, pulled forward as the room's light: the wax
// seal's olive at the envelope, the venue photo's warm sand at the
// invitation, the reply card's steel blue, the six worlds' palette of greens.
const EXPLAINER_TOTAL = 40;
const EXPLAINER_STOPS: Stop[] = [
  { t: 0, bg: "#f3f0e9", muted: "#7c7669" }, // Scatter
  { t: 5, bg: "#f2e2b8", muted: "#8a7233" }, // Envelope opens
  { t: 8, bg: "#e9d69e", muted: "#6f7449" }, // wax seal, olive
  { t: 10.5, bg: "#f4e6c4", muted: "#8a7233" }, // Invitation, warm venue sand
  { t: 14, bg: "#f0e0bd", muted: "#7c7669" },
  { t: 16.5, bg: "#c9dbe2", muted: "#3c5866" }, // Reply card, steel blue
  { t: 19.5, bg: "#b7d0da", muted: "#2f4d5c" },
  { t: 21.5, bg: "#f6efd8", muted: "#7c7669" }, // Pass, warm paper
  { t: 26.5, bg: "#dfe6c9", muted: "#556b2f" }, // Studio ledger, olive
  { t: 29.5, bg: "#cfe0b8", muted: "#4c6428" }, // Six worlds' greens
  { t: 35, bg: "#e2ebd2", muted: "#556b2f" },
  { t: 37, bg: "#f3f0e9", muted: "#7c7669" }, // Close, settles to ivory
];
function explainerAmbient(T: number): Ambient {
  return sampleStops(T, EXPLAINER_STOPS, EXPLAINER_TOTAL);
}

// The vertical cut genuinely swings dark/light: a night photograph, then
// paper flooding in once the invitation is reached, then the dark Studio
// panel, then paper again — the same "onDark" beats the scene itself keys to.
function adAmbient(T: number): Ambient {
  const paper = ramp(T, 2.6 + 0.2, 0.22);
  const plannersGround = ramp(T, 21 - 0.3, 0.8) * (1 - ramp(T, 26.4 - 0.35, 0.7));
  const endFade = ramp(T, 35 - 0.45, 0.45);
  const darkness = Math.max(1 - paper, plannersGround, endFade);
  return {
    bg: mixHex("#f6f3ea", "#15120e", darkness),
    ink: mixHex("#1d1b17", "#f3f0e9", darkness),
    muted: mixHex("#7c7669", "#b9b4a6", darkness),
  };
}

// The exact cue seconds for the explainer's 8 scenes (composition/
// explainer-scene.tsx's EXPLAINER_SCENES: Scatter 5, Envelope 5.5,
// Invitation 6, Reply 5, Pass 5, Studio 5.5, Worlds 5, Close 3), so clicking
// a moment below jumps the film to the beat it actually names.
const MOMENT_CUES = [0, 5, 10.5, 16.5, 21.5, 26.5, 32, 37];

const MOMENTS: [string, string, string][] = [
  ["01", "The scatter", "One wedding, and the guest list living in six places at once — a spreadsheet, a group chat, an inbox, a kitchen note."],
  ["02", "The envelope", "A sealed invitation addressed to one household. The wax breaks, the flap lifts, the letter rises."],
  ["03", "The invitation", "Names in the display serif, a venue plate sliding in, the save-the-date keepsake settling beside it."],
  ["04", "The reply", "The household answers as one — the tick draws, and meals, names and travel arrive as chips."],
  ["05", "The pass", "A private wedding pass with the household code and the order of the day, table and shuttle included."],
  ["06", "The Studio", "A ledger, row by row: what the planner sets on the left, what the guest meets on the right."],
  ["07", "Six worlds", "The same guest experience in six designs, each with its own paper, palette and voice."],
  ["08", "The close", "One guest list. One invitation, in six worlds."],
];

export default function Experience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const stageFrameRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLElement>(null);
  const phoneFrameRef = useRef<HTMLDivElement>(null);
  const phonePanelRef = useRef<HTMLDivElement>(null);
  const momentListRef = useRef<HTMLOListElement>(null);
  const explainerRef = useRef<CompositionHandle>(null);
  const scrubTrackRef = useRef<HTMLDivElement>(null);
  const scrubFillRef = useRef<HTMLDivElement>(null);
  const scrubHeadRef = useRef<HTMLDivElement>(null);
  const [activeMoment, setActiveMoment] = useState(0);
  const [scrubbed, setScrubbed] = useState(false);
  // Set for the moment a click jumps the film and the page smooth-scrolls
  // back to the hero — otherwise that scroll immediately re-triggers the
  // scroll-linked storyboard sync below and stomps the moment just picked.
  const manualJumpRef = useRef(false);

  // Every route into "jump the film somewhere" — a moment button below, or a
  // drag on the scrubber under the frame itself — goes through here.
  const seekFilm = useCallback((t: number, opts?: { scroll?: boolean }) => {
    explainerRef.current?.seek(t);
    let nearest = 0;
    for (let i = 1; i < MOMENT_CUES.length; i++)
      if (Math.abs(MOMENT_CUES[i] - t) < Math.abs(MOMENT_CUES[nearest] - t))
        nearest = i;
    setActiveMoment(nearest);
    setScrubbed(true);
    if (opts?.scroll) {
      // Otherwise the smooth-scroll back to the hero immediately re-triggers
      // the scroll-linked storyboard sync below and stomps the moment just
      // picked.
      manualJumpRef.current = true;
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        manualJumpRef.current = false;
      }, 1000);
    }
  }, []);

  // The storyboard is also the film's own scrubber: click a beat and the
  // hero jumps straight to it, rather than only ever narrating what's
  // already playing.
  const jumpTo = useCallback(
    (i: number) => seekFilm(MOMENT_CUES[i], { scroll: true }),
    [seekFilm],
  );

  // Stable identities: the composition's own render loop calls these directly
  // (see composition/runtime.tsx), so they must not need to change on every
  // render — they read the current DOM node from the ref each time instead.
  const onExplainerTick = useCallback((T: number) => {
    applyAmbient(heroRef.current, explainerAmbient(T));
    // A live playhead, mutated directly rather than through React state —
    // this fires every animation frame, same reasoning as applyAmbient.
    const pct = `${(T / EXPLAINER_TOTAL) * 100}%`;
    if (scrubFillRef.current) scrubFillRef.current.style.width = pct;
    if (scrubHeadRef.current) scrubHeadRef.current.style.left = pct;
  }, []);
  const onAdTick = useCallback((T: number) => {
    applyAmbient(verticalRef.current, adAmbient(T));
  }, []);

  // Click or drag anywhere on the strip under the frame to scrub the film —
  // a real timeline, not just eight fixed stops.
  const scrubAt = useCallback(
    (clientX: number) => {
      const track = scrubTrackRef.current;
      if (!track) return;
      const r = track.getBoundingClientRect();
      const ratio = clamp01((clientX - r.left) / r.width);
      seekFilm(ratio * EXPLAINER_TOTAL);
    },
    [seekFilm],
  );
  const onScrubPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      scrubAt(e.clientX);
    },
    [scrubAt],
  );
  const onScrubPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      scrubAt(e.clientX);
    },
    [scrubAt],
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          desktop: "(min-width: 901px)",
          motion: "(prefers-reduced-motion: no-preference)",
          pointer: "(hover: hover) and (pointer: fine)",
        },
        (context) => {
          const { desktop, motion, pointer } = context.conditions as Record<
            string,
            boolean
          >;
          if (!desktop || !motion) return;

          // The eight moments read as a storyboard, not a list: a spine runs
          // beside the numbers, the beat currently under the middle of the
          // viewport comes fully into focus, and the rest recede — the same
          // "in focus vs out of focus" a shot list actually has.
          const moments = momentListRef.current;
          if (moments) {
            const items = Array.from(
              moments.querySelectorAll<HTMLLIElement>("li"),
            );
            if (items.length) {
              ScrollTrigger.create({
                trigger: moments,
                start: "top center",
                end: "bottom center",
                onUpdate: (self) => {
                  // Only while genuinely scrolling through the section —
                  // otherwise a scroll elsewhere on the page (including the
                  // one jumpTo() itself triggers, back up to the hero) would
                  // clamp progress to 0 or 1 and stomp a moment picked by
                  // clicking rather than scrolling.
                  if (!self.isActive || manualJumpRef.current) return;
                  const i = Math.min(
                    items.length - 1,
                    Math.floor(self.progress * items.length),
                  );
                  setActiveMoment(i);
                },
              });
            }
          }

          // The film opens at the largest size that fits the screen without
          // ever cropping or distorting it — the true 16:9 frame, just as
          // big as the space below the title allows — then the inverse
          // happens: scrolling eases its width back down to a fixed, resting
          // size. Nothing sits on the film itself; the title stays above it
          // throughout, sized so it never has to move out of the way.
          const stage = stageFrameRef.current;
          if (stage) {
            const restW = 1040;
            // As wide as comfortably fits the screen, capped so it never
            // gets absurd on very wide monitors; height simply follows the
            // real 16:9 ratio, so the frame is never cropped or stretched.
            const startW = Math.max(restW, Math.round(Math.min(window.innerWidth * 0.86, 1480)));
            gsap.fromTo(
              stage,
              { width: startW },
              {
                width: restW,
                ease: "none",
                scrollTrigger: {
                  trigger: heroRef.current,
                  start: "top top",
                  end: "+=560",
                  scrub: true,
                },
              },
            );
          }

          // A restrained pointer tilt on the floating vertical-cut panel —
          // the room reacts to the cursor the way a physical object would.
          // (The hero film is edge-to-edge, so it has nothing to tilt into.)
          if (pointer) {
            const rigs: [HTMLElement | null, HTMLElement | null][] = [
              [phoneFrameRef.current, phonePanelRef.current],
            ];
            const cleanups: (() => void)[] = [];
            rigs.forEach(([frameEl, panelEl]) => {
              if (!frameEl || !panelEl) return;
              const rx = gsap.quickTo(panelEl, "rotateX", {
                duration: 0.6,
                ease: "power3",
              });
              const ry = gsap.quickTo(panelEl, "rotateY", {
                duration: 0.6,
                ease: "power3",
              });
              const onMove = (e: PointerEvent) => {
                const r = frameEl.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                rx(py * -5);
                ry(px * 5);
              };
              const onLeave = () => {
                rx(0);
                ry(0);
              };
              frameEl.addEventListener("pointermove", onMove);
              frameEl.addEventListener("pointerleave", onLeave);
              cleanups.push(() => {
                frameEl.removeEventListener("pointermove", onMove);
                frameEl.removeEventListener("pointerleave", onLeave);
              });
            });
            return () => cleanups.forEach((fn) => fn());
          }
        },
      );

      // The swipeable filmstrip of moments (mobile/tablet only — see
      // experience.css) reports which card is centred, so the folio above it
      // can name it instead of sitting there as a static hint forever.
      mm.add({ mobile: "(max-width: 900px)" }, (context) => {
        if (!context.conditions?.mobile) return;
        const list = momentListRef.current;
        if (!list) return;
        const items = Array.from(list.querySelectorAll<HTMLLIElement>("li"));
        if (!items.length) return;
        const io = new IntersectionObserver(
          (entries) => {
            let bestIndex = -1;
            let bestRatio = 0;
            entries.forEach((entry) => {
              const i = items.indexOf(entry.target as HTMLLIElement);
              if (i === -1) return;
              if (entry.intersectionRatio > bestRatio) {
                bestRatio = entry.intersectionRatio;
                bestIndex = i;
              }
            });
            if (bestIndex !== -1 && bestRatio > 0.5) setActiveMoment(bestIndex);
          },
          { root: list, threshold: [0.5, 0.6, 0.75, 0.9, 1] },
        );
        items.forEach((el) => io.observe(el));
        return () => io.disconnect();
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div className="xp" ref={rootRef}>
      <MarketingNavigation homeLinks />

      <main id="main" className="xp-main">
        <section className="xp-hero" ref={heroRef}>
          <div className="xp-hero-intro">
            <p className="eyebrow">VOW MOTION · THE FILM</p>
            <h1>Your story, in motion.</h1>
            <p className="xp-lede">
              Forty seconds, one continuous take — the invitation opening, the
              reply landing, the pass in hand, and the same wedding drawn six
              different ways.
            </p>
          </div>
          <div className="xp-hero-media" ref={stageFrameRef}>
            <div className="xp-hero-stage">
              <div className="xp-stage">
                <BrandExplainer ref={explainerRef} onTick={onExplainerTick} />
              </div>
            </div>
            {/* A real timeline under the frame — drag it, or click a chapter
                tick, and the film jumps there. Never on the video itself. */}
            <div
              className="xp-scrub-track"
              ref={scrubTrackRef}
              onPointerDown={onScrubPointerDown}
              onPointerMove={onScrubPointerMove}
              role="slider"
              aria-label="Scrub the film"
              aria-valuemin={0}
              aria-valuemax={EXPLAINER_TOTAL}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") jumpTo(Math.min(7, activeMoment + 1));
                if (e.key === "ArrowLeft") jumpTo(Math.max(0, activeMoment - 1));
              }}
            >
              <span className="xp-scrub-fill" ref={scrubFillRef} />
              {MOMENT_CUES.map((cue, i) => (
                <button
                  key={cue}
                  type="button"
                  className="xp-scrub-tick"
                  style={{ left: `${(cue / EXPLAINER_TOTAL) * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpTo(i);
                  }}
                  aria-label={`Jump to ${MOMENTS[i][1]}`}
                />
              ))}
              <span className="xp-scrub-head" ref={scrubHeadRef} />
            </div>
          </div>
          {/* Never on the video itself — this sits below the frame, the same
              rule the title above it already follows. */}
          {scrubbed && (
            <p className="xp-now-playing" aria-live="polite">
              <span>{MOMENTS[activeMoment][0]}</span>
              {MOMENTS[activeMoment][1]}
            </p>
          )}
          <p className="xp-note">
            Loops on its own. Pauses when it scrolls out of view, and holds
            still if you have reduced motion turned on.
          </p>
        </section>

        <section className="xp-moments section-pad">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EIGHT MOMENTS</p>
              <h2>
                One continuous composition, <em>not eight clips</em>.
              </h2>
            </div>
            <p>
              Nothing cuts. Each element carries into the next beat and settles —
              the way the product itself carries one guest list from the
              invitation all the way to the door.
              <span className="xp-moment-scrub-hint">
                {" "}Click a beat to jump the film straight to it.
              </span>
            </p>
          </div>
          <div className="xp-moment-hint" aria-hidden="true">
            <span>
              {MOMENTS[activeMoment][0]} — {MOMENTS[activeMoment][1]}
            </span>
            <Arrow size={12} />
          </div>
          <div className="xp-moment-track" aria-hidden="true">
            <span
              className="xp-moment-fill"
              style={{ transform: `scaleX(${(activeMoment + 1) / MOMENTS.length})` }}
            />
          </div>
          <div className="xp-moment-body">
            <div className="xp-moment-spine" aria-hidden="true">
              <span
                className="xp-moment-spine-fill"
                style={{ height: `${((activeMoment + 0.5) / MOMENTS.length) * 100}%` }}
              />
            </div>
            <ol className="xp-moment-list" ref={momentListRef}>
              {MOMENTS.map(([n, title, copy], i) => (
                <li key={n} className={i === activeMoment ? "is-active" : undefined}>
                  <button
                    type="button"
                    className="xp-moment-btn"
                    onClick={() => jumpTo(i)}
                  >
                    <span className="xp-moment-n">{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{copy}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="xp-vertical section-pad" ref={verticalRef}>
          <div className="xp-vertical-inner">
            <div className="xp-vertical-copy">
              <p className="eyebrow">FOR YOUR FEED</p>
              <h2>
                The same story, <em>cut for a phone</em>.
              </h2>
              <p>
                A thirty-five-second vertical cut — the group chat, the
                envelope, the invitation becoming six worlds, one reply and
                one pass. Built to be screen-recorded straight into a Reel or
                a story.
              </p>
              <a href="/planners" className="text-link">
                What planners get <Arrow diagonal size={15} />
              </a>
            </div>
            <div className="xp-phone-frame" ref={phoneFrameRef}>
              <div className="xp-phone-float">
                <div className="xp-phone" ref={phonePanelRef}>
                  <BrandAd onTick={onAdTick} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="xp-cta">
          <div className="xp-cta-worlds" aria-hidden="true">
            {worlds.map((w) => (
              <span
                key={w.id}
                style={{ background: w.palette[2] || w.palette[1] }}
              />
            ))}
          </div>
          <span>See it for real, in any of six worlds</span>
          <h2>Open a wedding, not a slideshow.</h2>
          <p>
            The film is built from the real thing — the same invitation, reply
            and pass a guest meets, in the same six worlds.
          </p>
          <div className="xp-cta-actions">
            <DemoButton>Open a live demo</DemoButton>
            <a href="/planners" className="text-link">
              For wedding planners <Arrow diagonal size={15} />
            </a>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <Brand />
        <span>Made for the moments that bring us together.</span>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
        <span>© {new Date().getFullYear()} Vow Motion</span>
      </footer>
    </div>
  );
}

/* Vow Motion — "What Vow Motion is" explainer.
   One continuous composition keyed to authored cues from EXPLAINER_SCENES.
   Ported from the Claude Design brief; motion and copy unchanged. */
import { useComposition, Shot, Captions, Easing, animate, clamp } from "./runtime";

const INK = "#1d1b17";
const IVORY = "#f3f0e9";
const PAPER = "#faf7f0";
const OLIVE = "#6f7449";
const RULE = "rgba(29,27,23,0.16)";
const MUTED = "#7c7669";
const DISPLAY = "'Bodoni Moda', 'Cormorant Garamond', serif";
const BODY = "'Manrope', system-ui, sans-serif";
const ACC = OLIVE;

type Cues = Record<string, number>;

const MOTION = {
  enter: (T: number, from: number, to: number, start: number, dur: number) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeOutCubic })(T),
  drift: (T: number, from: number, to: number, start: number, dur: number) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeInOutSine })(T),
  pop: (T: number, from: number, to: number, start: number, dur: number) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeOutBack })(T),
};

const kicker = (size?: number) =>
  ({
    fontFamily: BODY,
    fontSize: size || 26,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: MUTED,
    fontWeight: 500,
  }) as const;
const tnum = { fontVariantNumeric: "tabular-nums" } as const;

/* ---------- 1. Scatter: the guest list lives in six places ---------- */

const SCRAPS = [
  { x: -640, y: -230, r: -8, w: 460, h: 250, kind: "sheet", title: "guests_final_v4.xlsx" },
  { x: 470, y: -280, r: 6, w: 420, h: 300, kind: "chat" },
  { x: -520, y: 210, r: 5, w: 520, h: 210, kind: "mail" },
  { x: 430, y: 240, r: -6, w: 400, h: 220, kind: "note" },
  { x: 20, y: -60, r: -3, w: 470, h: 170, kind: "seating" },
] as const;

function Scrap({
  T,
  item,
  i,
  start,
  gather,
}: {
  T: number;
  item: (typeof SCRAPS)[number];
  i: number;
  start: number;
  gather: number;
}) {
  const p = MOTION.enter(T, 0, 1, start + i * 0.24, 1.0);
  const g = MOTION.enter(T, 0, 1, gather, 1.0);
  const sway = Math.sin((T + i) * 0.7) * 5;
  const x = item.x * p + (0 - item.x * p) * g;
  const y = item.y * p + 60 * (1 - p) + (0 - item.y * p) * g + sway * (1 - g);
  const rot = item.r * (1 - g) + (1 - p) * 8;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: item.w,
        height: item.h,
        marginLeft: -item.w / 2,
        marginTop: -item.h / 2,
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${0.9 + 0.1 * p - 0.24 * g})`,
        opacity: p * (1 - g),
        background: PAPER,
        border: `1px solid ${RULE}`,
        boxShadow: "0 18px 40px rgba(29,27,23,0.07)",
        padding: 26,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
      }}
    >
      {item.kind === "sheet" && (
        <>
          <div style={{ ...kicker(17) }}>{item.title}</div>
          {[0, 1, 2, 3].map((r) => (
            <div key={r} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ height: 12, width: 120, background: "rgba(29,27,23,0.14)" }} />
              <div style={{ height: 12, width: 78, background: "rgba(29,27,23,0.10)" }} />
              <div style={{ height: 12, width: 150, background: "rgba(29,27,23,0.08)" }} />
            </div>
          ))}
        </>
      )}
      {item.kind === "chat" && (
        <>
          <div style={{ ...kicker(17) }}>messages</div>
          <div style={{ fontFamily: BODY, fontSize: 25, lineHeight: 1.45, color: INK }}>
            &ldquo;Is the shuttle at 4 or 4:30?&rdquo;
          </div>
          <div
            style={{
              fontFamily: BODY,
              fontSize: 25,
              lineHeight: 1.45,
              color: MUTED,
              alignSelf: "flex-end",
              textAlign: "right",
            }}
          >
            &ldquo;I&rsquo;ll check and text you back&rdquo;
          </div>
        </>
      )}
      {item.kind === "mail" && (
        <>
          <div style={{ ...kicker(17) }}>inbox — 14 unread</div>
          {["Re: dietary requirements", "Re: can I bring a plus one", "Re: what should we wear"].map(
            (s) => (
              <div
                key={s}
                style={{
                  fontFamily: BODY,
                  fontSize: 23,
                  color: INK,
                  borderTop: `1px solid ${RULE}`,
                  paddingTop: 10,
                }}
              >
                {s}
              </div>
            ),
          )}
        </>
      )}
      {item.kind === "note" && (
        <>
          <div style={{ ...kicker(17) }}>kitchen</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 34, lineHeight: 1.3, color: INK }}>
            Aunt Rita — no shellfish.
            <br />
            Which table?
          </div>
        </>
      )}
      {item.kind === "seating" && (
        <>
          <div style={{ ...kicker(17) }}>seating — printed 3 weeks ago</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 999,
                  border: `1px solid ${RULE}`,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: BODY,
                  fontSize: 21,
                  color: MUTED,
                  ...tnum,
                }}
              >
                {n}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- 2. The sealed envelope ---------- */

function Envelope({ T, CUES }: { T: number; CUES: Cues }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Envelope - 0.3, 1.1);
  const push = MOTION.drift(T, 1, 1.1, CUES.Envelope + 1.6, 4.2);
  const out = MOTION.enter(T, 0, 1, CUES.Invitation - 0.4, 0.9);
  const seal = MOTION.enter(T, 0, 1, CUES.Envelope + 2.4, 0.9);
  const flap = MOTION.enter(T, 0, 1, CUES.Envelope + 3.0, 0.9);
  const rise = MOTION.enter(T, 0, 1, CUES.Envelope + 3.6, 1.1);
  const W = 1080;
  const H = 700;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: W,
        height: H,
        marginLeft: -W / 2,
        marginTop: -H / 2,
        transform: `translateY(${(1 - inP) * 70}px) scale(${(0.74 + 0.26 * inP) * push * (1 + 0.3 * out)})`,
        opacity: inP * (1 - out),
        perspective: 2000,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 70 - rise * 420,
          width: W - 180,
          height: H - 190,
          background: PAPER,
          border: `1px solid ${RULE}`,
          boxShadow: "0 22px 50px rgba(29,27,23,0.12)",
          opacity: rise,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 62,
          gap: 26,
        }}
      >
        <div style={kicker(22)}>Together with our families</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 88, letterSpacing: "0.02em" }}>
          Elena &amp; Matteo
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: IVORY,
          border: `1px solid ${RULE}`,
          boxShadow: "0 30px 70px rgba(29,27,23,0.16)",
          backgroundImage:
            "radial-gradient(circle at 12px 12px, rgba(111,116,73,0.13) 2.4px, transparent 2.6px)",
          backgroundSize: "46px 46px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 210,
          top: 420,
          width: 660,
          textAlign: "center",
          opacity: 1 - flap,
        }}
      >
        <div style={{ ...kicker(20), marginBottom: 14 }}>Invitation for</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 62 }}>The Hartley Household</div>
        <div style={{ width: 180, height: 1, background: RULE, margin: "26px auto 0" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: 300,
          transformOrigin: "top center",
          transform: `rotateX(${-168 * flap}deg)`,
          background: "#eee8dc",
          borderLeft: `1px solid ${RULE}`,
          borderRight: `1px solid ${RULE}`,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          backfaceVisibility: "hidden",
          opacity: 1 - clamp((flap - 0.5) / 0.4, 0, 1),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: W / 2 - 62,
          top: 232,
          width: 124,
          height: 124,
          borderRadius: 999,
          background: "#5e5a34",
          boxShadow:
            "inset 0 0 0 6px rgba(243,240,233,0.22), 0 10px 22px rgba(29,27,23,0.28)",
          display: "grid",
          placeItems: "center",
          fontFamily: DISPLAY,
          fontSize: 44,
          color: "#eee8dc",
          transform: `translate(${-140 * seal}px, ${210 * seal}px) rotate(${-46 * seal}deg) scale(${1 - 0.2 * seal})`,
          opacity: 1 - seal,
        }}
      >
        E&nbsp;M
      </div>
    </div>
  );
}

/* ---------- 3. The invitation ---------- */

function Invitation({ T, CUES }: { T: number; CUES: Cues }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Invitation - 0.3, 1.2);
  const breathe = MOTION.drift(T, 1, 1.035, CUES.Invitation + 0.8, 5.2);
  const recede = MOTION.enter(T, 0, 1, CUES.Reply - 0.2, 1.0);
  const plate = MOTION.enter(T, 0, 1, CUES.Invitation + 0.9, 1.2);
  const keep = MOTION.pop(T, 0, 1, CUES.Invitation + 2.4, 0.9);
  const silk = MOTION.drift(T, 0, 1, CUES.Invitation + 0.4, 4.0);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1560,
        height: 860,
        marginLeft: -780,
        marginTop: -430,
        transform: `translate(${-300 * recede}px, ${-30 * recede}px) scale(${(0.86 + 0.14 * inP) * breathe * (1 - 0.14 * recede)})`,
        opacity: inP * (1 - 0.72 * recede),
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 40,
          width: 620,
          height: 780,
          background: PAPER,
          padding: 22,
          border: `1px solid ${RULE}`,
          boxShadow: "0 26px 60px rgba(29,27,23,0.14)",
          transform: `translateX(${(1 - plate) * 140}px)`,
          opacity: plate,
        }}
      >
        <img
          src="/images/riviera.webp"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.92) contrast(1.02)",
            transform: `scale(${1.02 + 0.06 * silk})`,
          }}
        />
      </div>
      <img
        src="/images/invitation-silk.webp"
        alt=""
        style={{
          position: "absolute",
          right: 520,
          top: -50,
          width: 300,
          opacity: 0.9 * plate,
          transform: `translateY(${-20 + 34 * silk}px) rotate(${-4 + 3 * silk}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 90,
          width: 900,
          height: 680,
          background: PAPER,
          border: `1px solid ${RULE}`,
          boxShadow: "0 30px 70px rgba(29,27,23,0.13)",
          padding: "74px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div style={kicker(24)}>Together with our families</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 116, lineHeight: 1.02 }}>
          Elena
          <br />
          &amp; Matteo
        </div>
        <div style={{ width: "100%", height: 1, background: RULE }} />
        <div style={{ fontFamily: BODY, fontSize: 30, lineHeight: 1.6, color: INK, maxWidth: 640 }}>
          would love you to join us as we begin our forever.
        </div>
        <div style={{ display: "flex", gap: 56, marginTop: "auto", ...tnum }}>
          <div>
            <div style={kicker(18)}>Saturday</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 40, marginTop: 8 }}>12 June 2027</div>
          </div>
          <div>
            <div style={kicker(18)}>Where</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 40, marginTop: 8 }}>Lake Como, Italy</div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 610,
          width: 280,
          background: PAPER,
          border: `1px solid ${RULE}`,
          boxShadow: "0 18px 40px rgba(29,27,23,0.14)",
          padding: "26px 28px",
          transform: `scale(${keep}) rotate(${-3 * keep}deg)`,
          opacity: clamp(keep, 0, 1),
          transformOrigin: "center",
        }}
      >
        <div style={kicker(16)}>Save the date</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 74, lineHeight: 1, marginTop: 10, ...tnum }}>
          12
        </div>
        <div style={{ fontFamily: BODY, fontSize: 22, color: MUTED, marginTop: 6 }}>
          June 2027 · 15:30
        </div>
      </div>
    </div>
  );
}

/* ---------- 4. The reply ---------- */

function Reply({ T, CUES }: { T: number; CUES: Cues }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Reply - 0.1, 1.1);
  const out = MOTION.enter(T, 0, 1, CUES.Pass - 0.3, 0.9);
  const tick = MOTION.enter(T, 0, 1, CUES.Reply + 2.3, 0.8);
  const chip = MOTION.pop(T, 0, 1, CUES.Reply + 2.7, 0.8);
  const settle = MOTION.drift(T, 0, 1, CUES.Reply + 1.2, 3.4);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1180,
        height: 700,
        marginLeft: -520,
        marginTop: -330,
        transform: `translate(${-560 * out}px, ${(1 - inP) * 420 - 14 * settle}px) rotate(${-1.5 + 1.5 * inP}deg) scale(${0.94 + 0.06 * inP})`,
        opacity: inP * (1 - out),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -40,
          top: 70,
          width: 1260,
          height: 600,
          background: "#ece5d7",
          border: `1px solid ${RULE}`,
          boxShadow: "0 34px 70px rgba(29,27,23,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 0,
          width: 380,
          height: 620,
          background: "#40617a",
          padding: "52px 40px",
          color: "#eef1f3",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ ...kicker(18), color: "rgba(238,241,243,0.72)" }}>Reply card</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 60, lineHeight: 1.05, marginTop: "auto" }}>
          Elena
          <br />
          &amp; Matteo
        </div>
        <div style={{ width: 90, height: 1, background: "rgba(238,241,243,0.5)" }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 30,
          width: 740,
          height: 560,
          background: PAPER,
          border: `1px solid ${RULE}`,
          boxShadow: "0 22px 50px rgba(29,27,23,0.12)",
          padding: "54px 56px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={kicker(20)}>The Hartley Household</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 62, lineHeight: 1.1 }}>Will you join us?</div>
        <div style={{ width: "100%", height: 1, background: RULE }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="66" height="66" viewBox="0 0 66 66">
            <circle cx="33" cy="33" r="31" fill="none" stroke={RULE} strokeWidth="1" />
            <path
              d="M18 34 L29 45 L48 22"
              fill="none"
              stroke={ACC}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="60"
              strokeDashoffset={60 * (1 - tick)}
            />
          </svg>
          <div style={{ fontFamily: DISPLAY, fontSize: 46 }}>Accepts with pleasure</div>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
          {["2 attending", "No shellfish — Rita", "Shuttle from town, 16:00"].map((label, i) => (
            <div
              key={label}
              style={{
                fontFamily: BODY,
                fontSize: 22,
                padding: "12px 20px",
                border: `1px solid ${ACC}`,
                color: "#4e5233",
                opacity: clamp(chip * 1.2 - i * 0.18, 0, 1),
                transform: `translateY(${(1 - clamp(chip * 1.2 - i * 0.18, 0, 1)) * 14}px)`,
                ...tnum,
              }}
            >
              {label}
            </div>
          ))}
        </div>
        <div style={{ ...kicker(17), marginTop: "auto" }}>Kindly reply by 1 May 2027</div>
      </div>
    </div>
  );
}

/* ---------- 5. The wedding pass ---------- */

const QR = [
  [1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 1, 0],
  [1, 0, 1, 1, 0, 1, 1],
  [1, 1, 0, 1, 1, 0, 0],
  [1, 0, 1, 0, 1, 1, 1],
];

function Pass({ T, CUES }: { T: number; CUES: Cues }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Pass - 0.2, 1.1);
  const out = MOTION.enter(T, 0, 1, CUES.Studio - 0.5, 0.9);
  const qr = MOTION.pop(T, 0, 1, CUES.Pass + 1.4, 0.8);
  const drift = MOTION.drift(T, 0, 1, CUES.Pass + 0.6, 4.2);
  const rows = [
    { t: "15:30", label: "Ceremony", place: "Villa Balbiano, lakeside terrace" },
    { t: "17:00", label: "Aperitivo", place: "Cypress walk" },
    { t: "20:00", label: "Dinner", place: "The orangery — Table 4" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1420,
        height: 720,
        marginLeft: -710,
        marginTop: -360,
        transform: `translate(${(1 - inP) * 620}px, ${-120 * out - 10 * drift}px) rotate(${(1 - inP) * -2.5}deg) scale(${(0.94 + 0.06 * inP) * (1 - 0.1 * out)})`,
        opacity: inP * (1 - out),
        display: "flex",
        background: PAPER,
        border: `1px solid ${RULE}`,
        boxShadow: "0 34px 74px rgba(29,27,23,0.16)",
      }}
    >
      <div
        style={{
          width: 420,
          padding: "54px 46px",
          borderRight: `1px dashed ${RULE}`,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={kicker(18)}>Wedding pass</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 46, lineHeight: 1.1 }}>
          The Hartley
          <br />
          Household
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            width: 196,
            marginTop: "auto",
            transform: `scale(${clamp(qr, 0, 1)})`,
            transformOrigin: "left bottom",
          }}
        >
          {QR.flatMap((r, y) =>
            r.map((v, x) => (
              <div
                key={`${x}-${y}`}
                style={{ paddingTop: "100%", background: v ? INK : "transparent" }}
              />
            )),
          )}
        </div>
        <div style={{ ...kicker(15) }}>Private — this household only</div>
      </div>
      <div style={{ flex: 1, padding: "54px 56px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 40 }}>Order of the day</div>
          <div style={{ ...kicker(17), ...tnum }}>Saturday · CEST</div>
        </div>
        <div style={{ marginTop: 34, position: "relative", paddingLeft: 30 }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 6,
              bottom: 6,
              width: 1,
              background: RULE,
              transform: `scaleY(${MOTION.enter(T, 0, 1, CUES.Pass + 1.1, 0.9)})`,
              transformOrigin: "top",
            }}
          />
          {rows.map((r, i) => {
            const p = MOTION.enter(T, 0, 1, CUES.Pass + 1.6 + i * 0.45, 0.8);
            return (
              <div
                key={r.label}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 26,
                  padding: "22px 0",
                  borderBottom: i < 2 ? `1px solid ${RULE}` : "none",
                  opacity: p,
                  transform: `translateX(${(1 - p) * 26}px)`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: -4,
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    background: OLIVE,
                    marginTop: 16,
                    opacity: p,
                  }}
                />
                <div
                  style={{
                    fontFamily: BODY,
                    fontSize: 30,
                    padding: "6px 14px",
                    border: `1px solid ${RULE}`,
                    ...tnum,
                  }}
                >
                  {r.t}
                </div>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 40 }}>{r.label}</div>
                  <div style={{ fontFamily: BODY, fontSize: 24, color: MUTED, marginTop: 6 }}>
                    {r.place}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 6. Studio: what the planner sets, what the guest meets ---------- */

const LEDGER = [
  ["Chooses the world and the opening", "A sealed envelope in their own hand"],
  ["Enters one household, once", "One reply for everyone at that address"],
  ["Sets the shuttle and the tables", "A pass with their table and their ride"],
];

function Ledger({ T, CUES }: { T: number; CUES: Cues }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Studio + 0.1, 1.0);
  const out = MOTION.enter(T, 0, 1, CUES.Worlds - 0.6, 0.8);
  const spine = MOTION.enter(T, 0, 1, CUES.Studio + 0.5, 1.2);
  return (
    <div
      style={{
        position: "absolute",
        left: 200,
        right: 200,
        top: 150,
        bottom: 190,
        opacity: inP * (1 - out),
        transform: `translateY(${(1 - inP) * 40 - 30 * out}px)`,
      }}
    >
      <div style={{ display: "flex", gap: 60 }}>
        <div style={{ flex: 1, ...kicker(22) }}>What the planner sets</div>
        <div style={{ flex: 1, ...kicker(22), color: "#4e5233" }}>What the guest meets</div>
      </div>
      <div style={{ height: 1, background: INK, marginTop: 22, opacity: 0.5 }} />
      <div style={{ position: "relative", marginTop: 10 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: RULE,
            transform: `scaleY(${spine})`,
            transformOrigin: "top",
          }}
        />
        {LEDGER.map((row, i) => {
          const p = MOTION.enter(T, 0, 1, CUES.Studio + 1.0 + i * 0.7, 1.0);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                display: "flex",
                gap: 60,
                alignItems: "center",
                padding: "46px 0",
                borderBottom: `1px solid ${RULE}`,
                opacity: p,
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontFamily: DISPLAY,
                  fontSize: 46,
                  lineHeight: 1.25,
                  transform: `translateX(${(1 - p) * -40}px)`,
                }}
              >
                {row[0]}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginTop: -6,
                  marginLeft: -6,
                  width: 11,
                  height: 11,
                  borderRadius: 999,
                  background: ACC,
                  transform: `scale(${p})`,
                }}
              />
              <div
                style={{
                  flex: 1,
                  fontFamily: DISPLAY,
                  fontStyle: "italic",
                  fontSize: 46,
                  lineHeight: 1.25,
                  color: "#4e5233",
                  transform: `translateX(${(1 - p) * 40}px)`,
                }}
              >
                {row[1]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 7. Six worlds ---------- */

const WORLDS = [
  { n: "Riviera", img: "/images/riviera.webp", pal: ["#efe9d9", "#40617a", "#858a66"], line: "Lake Como" },
  { n: "Maison", img: "/images/maison.webp", pal: ["#f3f0e9", "#282824", "#9c8c7e"], line: "Provence" },
  { n: "Notte", img: "/images/notte.webp", pal: ["#1b1b1b", "#dfd0b6", "#6b343e"], line: "New York" },
  { n: "Heritage", img: "/images/heritage.webp", pal: ["#ede8dc", "#514c36", "#a49a73"], line: "Cotswolds" },
  { n: "Modernist", img: "/images/modernist.webp", pal: ["#e5e7e6", "#263fa0", "#df693b"], line: "Copenhagen" },
  { n: "Garden", img: "/images/garden.webp", pal: ["#e6e9db", "#466044", "#aba58a"], line: "Tuscany" },
];

function Worlds({ T, CUES }: { T: number; CUES: Cues }) {
  const out = MOTION.enter(T, 0, 1, CUES.Close - 0.7, 0.8);
  const pan = MOTION.drift(T, 70, -70, CUES.Worlds + 0.2, 4.8);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 190,
        display: "flex",
        gap: 34,
        justifyContent: "center",
        transform: `translateX(${pan}px)`,
        opacity: 1 - out,
      }}
    >
      {WORLDS.map((w, i) => {
        const p = MOTION.enter(T, 0, 1, CUES.Worlds + 0.2 + i * 0.22, 1.0);
        return (
          <div key={w.n} style={{ width: 268, opacity: p, transform: `translateY(${(1 - p) * 70}px)` }}>
            <div
              style={{
                background: PAPER,
                border: `1px solid ${RULE}`,
                padding: 14,
                boxShadow: "0 20px 44px rgba(29,27,23,0.10)",
              }}
            >
              <img
                src={w.img}
                alt=""
                style={{
                  width: "100%",
                  height: 400,
                  objectFit: "cover",
                  display: "block",
                  filter: "saturate(0.9)",
                  transform: `scale(${1.01 + 0.05 * p})`,
                }}
              />
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 42, marginTop: 22 }}>{w.n}</div>
            <div style={{ fontFamily: BODY, fontSize: 21, color: MUTED, marginTop: 4 }}>{w.line}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {w.pal.map((c) => (
                <div
                  key={c}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: c,
                    border: `1px solid ${RULE}`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 8. Close ---------- */

function Close({ T, CUES, total }: { T: number; CUES: Cues; total: number }) {
  const inP = MOTION.enter(T, 0, 1, CUES.Close + 0.1, 1.0);
  const rule = MOTION.enter(T, 0, 1, CUES.Close + 0.8, 0.9);
  const tag = MOTION.enter(T, 0, 1, CUES.Close + 1.3, 0.9);
  const fade = MOTION.enter(T, 0, 1, total - 0.6, 0.6);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        opacity: inP * (1 - fade),
      }}
    >
      <div style={kicker(24)}>Vow Motion</div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 132,
          lineHeight: 1,
          transform: `scale(${0.95 + 0.05 * inP})`,
        }}
      >
        One guest list.
      </div>
      <div style={{ width: 420 * rule, height: 1, background: INK, opacity: 0.55 }} />
      <div
        style={{
          fontFamily: DISPLAY,
          fontStyle: "italic",
          fontSize: 52,
          color: "#4e5233",
          opacity: tag,
          transform: `translateY(${(1 - tag) * 16}px)`,
        }}
      >
        One invitation, in six worlds.
      </div>
    </div>
  );
}

/* ---------- the piece ---------- */

export const EXPLAINER_SCENES = [
  { name: "Scatter", dur: 5 },
  { name: "Envelope", dur: 5.5 },
  { name: "Invitation", dur: 6 },
  { name: "Reply", dur: 5 },
  { name: "Pass", dur: 5 },
  { name: "Studio", dur: 5.5 },
  { name: "Worlds", dur: 5 },
  { name: "Close", dur: 3 },
];

export default function ExplainerScene() {
  const { T, CUES, authoredTotal } = useComposition();
  const bedIn = MOTION.enter(T, 0, 1, CUES.Envelope - 0.6, 1.0);
  const bedOut = MOTION.enter(T, 0, 1, CUES.Studio - 0.8, 1.0);
  const bedZoom = MOTION.drift(T, 1.04, 1.2, CUES.Envelope - 0.6, 20);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: IVORY,
        overflow: "hidden",
        color: INK,
        fontFamily: BODY,
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: bedIn * (1 - bedOut) * 0.5 }}>
        <img
          src="/images/wedding-evening.webp"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${bedZoom})`,
            filter: "saturate(0.7) brightness(1.12)",
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(243,240,233,0.62)" }} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 42%, rgba(243,240,233,0) 40%, rgba(29,27,23,0.10) 100%)",
        }}
      />

      <Shot from={0} to={CUES.Envelope + 1.2}>
        {SCRAPS.map((s, i) => (
          <Scrap key={i} T={T} item={s} i={i} start={0.3} gather={CUES.Envelope - 0.8} />
        ))}
      </Shot>

      <Shot from={CUES.Envelope - 0.6} to={CUES.Invitation + 0.8}>
        <Envelope T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Invitation - 0.6} to={CUES.Pass}>
        <Invitation T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Reply - 0.4} to={CUES.Pass + 1.0}>
        <Reply T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Pass - 0.5} to={CUES.Studio + 0.6}>
        <Pass T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Studio - 0.2} to={CUES.Worlds + 0.4}>
        <Ledger T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Worlds - 0.2} to={CUES.Close + 0.4}>
        <Worlds T={T} CUES={CUES} />
      </Shot>

      <Shot from={CUES.Close - 0.2} to={authoredTotal + 0.1}>
        <Close T={T} CUES={CUES} total={authoredTotal} />
      </Shot>

      <Captions
        style={{
          font: "500 30px Manrope, system-ui, sans-serif",
          letterSpacing: "0.02em",
          color: INK,
          bottom: "6%",
        }}
        items={[
          { at: 1.0, until: 4.4, text: "One wedding. Six places the guest list lives." },
          {
            at: CUES.Worlds + 0.4,
            until: CUES.Close - 0.8,
            text: "Six worlds — each with its own paper, palette and voice.",
          },
        ]}
      />
    </div>
  );
}

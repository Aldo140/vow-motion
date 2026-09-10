/* Vow Motion — brand ad v2, vertical 1080x1920.
   Every beat shows a real product surface: the guest invitation on a phone, the
   reply, the pass, the order of the day, and the Studio that feeds all of them.
   Type, palette and ornament come from src/lib/worlds.ts; the crest geometry
   from src/components/guest-crest.tsx. */
import { useComposition, Shot, Easing, animate, clamp } from "./runtime";

const INK = '#1d1b17';
const IVORY = '#f3f0e9';
const PAPER = '#faf7f0';
const OLIVE = '#6f7449';
const RULE = 'rgba(29,27,23,0.16)';
const MUTED = '#7c7669';
const BODONI = "'Bodoni Moda', serif";
const BODY = "'Manrope', system-ui, sans-serif";
const ITALIANA = "'Italiana', 'Bodoni Moda', serif";
const BASKERVILLE = "'Libre Baskerville', 'Bodoni Moda', serif";

const MOTION = {
  enter: (T, from, to, start, dur) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeOutCubic })(T),
  drift: (T, from, to, start, dur) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeInOutSine })(T),
  pop: (T, from, to, start, dur) =>
    animate({ from, to, start, end: start + dur, ease: Easing.easeOutBack })(T),
};

/* One camera for the whole piece: keyframes in authored seconds, eased between.
   A zoom target is expressed as the frame point it should centre on. */
function camAt(T, keys) {
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (T >= keys[i].t && T <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
    if (T > keys[keys.length - 1].t) { a = b; }
  }
  if (a === b) return { s: a.s, x: a.x || 0, y: a.y || 0 };
  const k = MOTION.drift(T, 0, 1, a.t, Math.max(0.0001, b.t - a.t));
  return {
    s: a.s + (b.s - a.s) * k,
    x: (a.x || 0) + ((b.x || 0) - (a.x || 0)) * k,
    y: (a.y || 0) + ((b.y || 0) - (a.y || 0)) * k,
  };
}

const kick = (size, color) => ({
  fontFamily: BODY,
  fontSize: size || 22,
  fontWeight: 600,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: color || MUTED,
});
const tnum = { fontVariantNumeric: 'tabular-nums' };

/* The wordmark exactly as the product sets it (Brand() in src/components/ui.tsx
   with .brand / .brand span / .brand i / .brand.light from src/app/globals.css):
   the SANS face, 23px, VOW at 600 and MOTION at 400, letter-spacing -1.2px,
   baseline-aligned, and a 9px registered mark hung from the cap line. Scoped
   sizes in the app are 15px (mini nav), 19px (footer) and 21px (Studio sidebar);
   every metric here scales off the real 23px lockup. */
function Brand({ size, light, color }) {
  const f = size || 23;
  const k = f / 23;
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap',
        fontFamily: BODY, fontSize: f, fontWeight: 600,
        letterSpacing: -1.2 * k, lineHeight: 1,
        color: color || (light ? '#ffffff' : INK),
      }}
    >
      VOW
      <span style={{ fontWeight: 400, marginLeft: 5 * k }}>MOTION</span>
      <span style={{ fontSize: 9 * k, alignSelf: 'flex-start', marginLeft: 4 * k, letterSpacing: 0 }}>®</span>
    </div>
  );
}

/* ---------- the six worlds, as the product defines them ---------- */

const WORLDS = [
  {
    id: 'riviera', name: 'Riviera', img: '/images/riviera.webp',
    paper: '#efe9d9', ink: '#22303b', accent: '#40617a', soft: '#858a66', font: ITALIANA,
    couple: ['Elena', 'Matteo'], sep: '&', place: 'Lake Como, Italy', date: '12 June 2027',
    kicker: 'Together with our families',
    line: 'would love you to join us as we begin our forever.',
    ornament: 'silk',
  },
  {
    id: 'maison', name: 'Maison', img: '/images/maison.webp',
    paper: '#f3f0e9', ink: '#282824', accent: '#9c8c7e', soft: '#b6a795', font: BODONI,
    couple: ['Amélie', 'Julien'], sep: '&', place: 'Provence, France', date: '4 September 2027',
    kicker: 'Two families, one long table',
    line: 'request the pleasure of your company for a very long lunch.',
    ornament: 'silk',
  },
  {
    id: 'notte', name: 'Notte', img: '/images/notte.webp',
    paper: '#1b1b1b', ink: '#dfd0b6', accent: '#b98c93', soft: '#6b343e', font: BODONI,
    couple: ['Isabel', 'Oliver'], sep: '&', place: 'New York, USA', date: '18 October 2027',
    kicker: 'The night is yours as much as ours',
    line: 'would be honoured by your company for one unrepeatable night.',
    ornament: 'silk',
  },
  {
    id: 'heritage', name: 'Heritage', img: '/images/heritage.webp',
    paper: '#ede8dc', ink: '#2f2c20', accent: '#8a7d55', soft: '#a49a73', font: BASKERVILLE,
    couple: ['Charlotte', 'James'], sep: '&', place: 'Cotswolds, England', date: '22 May 2027',
    kicker: 'Together with their families',
    line: 'request the honour of your presence at the marriage of',
    ornament: 'sprig',
  },
  {
    id: 'modernist', name: 'Modernist', img: '/images/modernist.webp',
    paper: '#e5e7e6', ink: '#1b1b1b', accent: '#263fa0', soft: '#df693b', font: BODY,
    couple: ['Alex', 'Sam'], sep: '+', place: 'Copenhagen, Denmark', date: '9 July 2027',
    kicker: 'We are getting married',
    line: 'and we would like you there. No speeches you have to sit through.',
    ornament: 'none',
  },
  {
    id: 'garden', name: 'Garden', img: '/images/garden.webp',
    paper: '#e6e9db', ink: '#26301f', accent: '#466044', soft: '#aba58a', font: ITALIANA,
    couple: ['Sofia', 'Luca'], sep: '&', place: 'Tuscany, Italy', date: '6 June 2027',
    kicker: 'Under the olive trees',
    line: 'would love you to join us for a day spent entirely outside.',
    ornament: 'sprig',
  },
];
const byId = (id) => WORLDS.filter((w) => w.id === id)[0];

/* ---------- the engraved crest (src/components/guest-crest.tsx) ---------- */

function Crest({ color, progress, width, initials, plain, sep }) {
  const c = color || INK;
  const p = clamp(progress == null ? 1 : progress, 0, 1);
  const seg = (from, to) => 1 - clamp((p - from) / (to - from), 0, 1);
  const line = (dash, w, o) => ({
    fill: 'none', stroke: c, strokeWidth: w, opacity: o,
    pathLength: 1, strokeDasharray: 1, strokeDashoffset: dash,
  });
  const outer = seg(0, 0.45);
  const inner = seg(0.12, 0.6);
  const orn = seg(0.25, 0.78);
  const settle = clamp((p - 0.55) / 0.45, 0, 1);
  const W = width || 200;
  const ini = initials || ['E', 'M'];
  return (
    <div style={{ position: 'relative', width: W, height: (W * 260) / 200, color: c }}>
      <svg viewBox="0 0 200 260" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {plain ? (
          <g>
            <rect x="30" y="34" width="140" height="192" {...line(outer, 1.1, 0.75)} />
            <rect x="39" y="43" width="122" height="174" {...line(inner, 0.6, 0.45)} />
          </g>
        ) : (
          <g>
            <ellipse cx="100" cy="130" rx="70" ry="96" {...line(outer, 1.1, 0.75)} />
            <ellipse cx="100" cy="130" rx="61" ry="86" {...line(inner, 0.6, 0.45)} />
            <path d="M100 34c-9-9-20-13-30-9 6 3 9 8 9 14M100 34c9-9 20-13 30-9-6 3-9 8-9 14M100 22v12" strokeLinecap="round" {...line(orn, 0.9, 0.6)} />
            <path d="M100 226c-9 9-20 13-30 9 6-3 9-8 9-14M100 226c9 9 20 13 30 9-6-3-9-8-9-14M100 238v-12" strokeLinecap="round" {...line(orn, 0.9, 0.6)} />
            <path d="M30 130c-9-6-15-2-15 5s7 9 11 4M170 130c9-6 15-2 15 5s-7 9-11 4" strokeLinecap="round" {...line(orn, 0.9, 0.6)} />
            {[[100, 44], [100, 216], [39, 130], [161, 130]].map((d) => (
              <circle key={d.join()} cx={d[0]} cy={d[1]} r="1.6" fill={c} opacity={0.5 * settle} />
            ))}
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'baseline',
          justifyContent: 'center', gap: W * 0.022, lineHeight: 1, paddingTop: '50%',
          fontFamily: plain ? BODY : BODONI, opacity: settle,
        }}
      >
        <span style={{ fontSize: W * 0.23 }}>{ini[0]}</span>
        <span style={{ fontSize: W * 0.115, fontStyle: plain ? 'normal' : 'italic', opacity: 0.65 }}>{sep || '&'}</span>
        <span style={{ fontSize: W * 0.23 }}>{ini[1]}</span>
      </div>
    </div>
  );
}

/* ---------- the phone, and the screens that live in it ---------- */

const PH_W = 620;
const PH_H = 1290;

function Phone({ children, x, y, scale, w, h, rotate, tiltY, gloss }) {
  const width = w || PH_W;
  const height = h || PH_H;
  const sc = scale == null ? 1 : scale;
  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: '50%', width, height,
        marginLeft: -width / 2, marginTop: -height / 2,
        transform: `translate(${x || 0}px, ${y || 0}px) rotate(${rotate || 0}deg) scale(${sc})`,
        transformStyle: 'preserve-3d', perspective: 2400,
      }}
    >
      {/* the shadow the phone casts on the ground */}
      <div
        style={{
          position: 'absolute', left: '8%', right: '8%', bottom: -34, height: 60,
          background: 'radial-gradient(50% 50% at 50% 50%, rgba(16,15,13,0.42), transparent 70%)',
          filter: 'blur(6px)',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          transform: `rotateY(${tiltY || 0}deg)`,
          background: 'linear-gradient(150deg, #26241f, #141210 55%, #211f1a)',
          borderRadius: width * 0.075, padding: width * 0.018,
          boxShadow: '0 70px 140px rgba(16,15,13,0.55), inset 0 0 0 2px rgba(243,240,233,0.1), inset 0 0 0 6px rgba(16,15,13,0.6)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: width * 0.058, overflow: 'hidden', background: '#000' }}>
          {children}
          {/* glass */}
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
              background: `linear-gradient(${118 + (gloss || 0) * 40}deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 68%, rgba(255,255,255,0.07) 100%)`,
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ ink }) {
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 62, zIndex: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 34px', fontFamily: BODY, fontSize: 20, fontWeight: 600,
        color: ink, opacity: 0.75, ...tnum,
      }}
    >
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        {[8, 11, 14, 17].map((h) => (
          <div key={h} style={{ width: 5, height: h, background: ink, opacity: 0.6 }} />
        ))}
        <div style={{ width: 30, height: 15, border: `1.5px solid ${ink}`, marginLeft: 8, padding: 2 }}>
          <div style={{ width: '70%', height: '100%', background: ink }} />
        </div>
      </div>
    </div>
  );
}

function Dock({ w, active }) {
  const pill = (label, filled) => ({
    flex: 1, textAlign: 'center', padding: '20px 0', fontFamily: BODY, fontSize: 23,
    fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: filled ? w.paper : w.ink,
    background: filled ? w.accent : 'transparent',
    border: `1px solid ${filled ? w.accent : w.ink}`,
    opacity: filled ? 1 : 0.75,
  });
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5,
        padding: '22px 30px 34px', display: 'flex', gap: 16,
        background: w.paper, borderTop: `1px solid ${w.ink}22`,
      }}
    >
      <div style={pill('RSVP', active !== 'pass')}>Reply</div>
      <div style={pill('Pass', active === 'pass')}>Wedding pass</div>
    </div>
  );
}

/* the guest invitation, exactly as the world speaks it */
function InvitationScreen({ w, scroll, crest }) {
  const sc = scroll || 0;
  const nameSize = Math.min(78, 900 / (w.couple[0].length + w.couple[1].length + 2));
  return (
    <div style={{ position: 'absolute', inset: 0, background: w.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -sc * 0.45, height: 740, overflow: 'hidden' }}>
        <img src={w.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, ${w.paper}44, transparent 40%, ${w.paper})` }} />
      </div>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 560 - sc, padding: '0 52px 40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, color: w.ink,
        }}
      >
        {crest != null && (
          <Crest color={w.accent} progress={crest} width={150} plain={w.ornament === 'none'}
            initials={[w.couple[0][0], w.couple[1][0]]} sep={w.sep} />
        )}
        <div style={{ ...kick(19, w.ink), opacity: 0.65, textAlign: 'center' }}>{w.kicker}</div>
        <div style={{ fontFamily: w.font, fontSize: nameSize, lineHeight: 1.06, textAlign: 'center' }}>
          {w.couple[0]}
          <span style={{ fontSize: nameSize * 0.56, opacity: 0.6, padding: '0 14px' }}>{w.sep}</span>
          {w.couple[1]}
        </div>
        <div style={{ width: 120, height: 1, background: w.ink, opacity: 0.3 }} />
        <div style={{ fontFamily: BODY, fontSize: 25, lineHeight: 1.6, textAlign: 'center', opacity: 0.82, maxWidth: 440 }}>
          {w.line}
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 10, ...tnum }}>
          <div style={{ fontFamily: w.font, fontSize: 30 }}>{w.date}</div>
          <div style={{ fontFamily: w.font, fontSize: 30, opacity: 0.7 }}>{w.place}</div>
        </div>
      </div>
      <StatusBar ink={w.paper === '#1b1b1b' ? w.ink : '#ffffff'} />
      <Dock w={w} />
    </div>
  );
}

/* the household reply */
function ReplyScreen({ w, tick, chips }) {
  const opt = (label, on) => (
    <div
      key={label}
      style={{
        flex: 1, padding: '26px 0', textAlign: 'center', fontFamily: BODY, fontSize: 24,
        fontWeight: 600, border: `1px solid ${w.ink}33`,
        background: on ? w.accent : 'transparent',
        color: on ? w.paper : w.ink, opacity: on ? 1 : 0.7,
      }}
    >
      {label}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, background: w.paper, color: w.ink, padding: '110px 46px 0' }}>
      <div style={{ ...kick(19, w.ink), opacity: 0.6 }}>The Hartley Household</div>
      <div style={{ fontFamily: w.font, fontSize: 66, marginTop: 22 }}>Will you join us?</div>
      <div style={{ height: 1, background: w.ink, opacity: 0.2, margin: '34px 0' }} />
      <div style={{ display: 'flex', gap: 14 }}>
        {opt('Joyfully accepts', tick > 0.4)}
        {opt('Regretfully declines', false)}
      </div>
      <div style={{ marginTop: 40 }}>
        {['Rebecca Hartley', 'Tom Hartley'].map((n, i) => (
          <div
            key={n}
            style={{
              display: 'flex', alignItems: 'center', gap: 20, padding: '26px 0',
              borderBottom: `1px solid ${w.ink}1e`,
              opacity: clamp(tick * 1.4 - i * 0.25, 0, 1),
            }}
          >
            <svg width="42" height="42" viewBox="0 0 42 42">
              <rect x="1" y="1" width="40" height="40" fill="none" stroke={w.ink} strokeOpacity="0.3" />
              <path d="M10 22 L18 30 L32 12" fill="none" stroke={w.accent} strokeWidth="3.4"
                strokeLinecap="round" strokeDasharray="42" strokeDashoffset={42 * (1 - clamp(tick * 1.4 - i * 0.25, 0, 1))} />
            </svg>
            <div style={{ fontFamily: w.font, fontSize: 38 }}>{n}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 34 }}>
        {['No shellfish — Rebecca', 'Shuttle from town', 'Staying Fri–Sun'].map((c, i) => (
          <div
            key={c}
            style={{
              fontFamily: BODY, fontSize: 20, padding: '12px 18px', border: `1px solid ${w.accent}`,
              color: w.accent, opacity: clamp(chips * 1.3 - i * 0.2, 0, 1),
              transform: `translateY(${(1 - clamp(chips * 1.3 - i * 0.2, 0, 1)) * 12}px)`,
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <StatusBar ink={w.ink} />
      <Dock w={w} />
    </div>
  );
}

/* the wedding pass */
const QR = [
  [1, 1, 1, 0, 1, 0, 1], [1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 1],
  [0, 1, 1, 0, 1, 1, 0], [1, 0, 1, 1, 0, 1, 1], [1, 1, 0, 1, 1, 0, 0],
  [1, 0, 1, 0, 1, 1, 1],
];

function PassScreen({ w, qr, rows }) {
  const day = [
    ['15:30', 'Ceremony', 'Lakeside terrace'],
    ['17:00', 'Aperitivo', 'Cypress walk'],
    ['20:00', 'Dinner', 'The orangery'],
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, background: w.paper, color: w.ink, padding: '110px 46px 0' }}>
      <div style={{ ...kick(19, w.ink), opacity: 0.6 }}>Wedding pass</div>
      <div style={{ display: 'flex', gap: 28, marginTop: 26, alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: 168, transform: `scale(${clamp(qr, 0, 1)})`, transformOrigin: 'left top' }}>
          {QR.flatMap((r, y) => r.map((v, x) => (
            <div key={x + '-' + y} style={{ paddingTop: '100%', background: v ? w.ink : 'transparent' }} />
          )))}
        </div>
        <div>
          <div style={{ fontFamily: w.font, fontSize: 46, lineHeight: 1.1 }}>The Hartley<br />Household</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            {['Table 4', 'Shuttle 16:00'].map((t) => (
              <div key={t} style={{ fontFamily: BODY, fontSize: 20, padding: '10px 16px', background: w.accent, color: w.paper, ...tnum }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: w.ink, opacity: 0.2, margin: '34px 0 10px' }} />
      <div style={{ position: 'relative', paddingLeft: 44 }}>
        <div style={{ position: 'absolute', left: 11, top: 10, bottom: 20, width: 1, background: w.ink, opacity: 0.2, transform: `scaleY(${clamp(rows * 1.2, 0, 1)})`, transformOrigin: 'top' }} />
        {day.map((d, i) => {
          const p = clamp(rows * 1.6 - i * 0.3, 0, 1);
          return (
            <div key={d[1]} style={{ position: 'relative', padding: '22px 0', borderBottom: i < 2 ? `1px solid ${w.ink}1a` : 'none', opacity: p, transform: `translateX(${(1 - p) * 20}px)` }}>
              <div style={{ position: 'absolute', left: -44, top: 30, width: 23, height: 23, borderRadius: 999, border: `1px solid ${w.ink}33`, background: w.paper, display: 'grid', placeItems: 'center' }}>
                <div style={{ width: 7, height: 7, borderRadius: 999, background: w.accent }} />
              </div>
              <div style={{ fontFamily: BODY, fontSize: 20, letterSpacing: '0.14em', color: w.paper, background: w.accent, display: 'inline-block', padding: '5px 12px', ...tnum }}>{d[0]}</div>
              <div style={{ fontFamily: w.font, fontSize: 40, marginTop: 10 }}>{d[1]}</div>
              <div style={{ fontFamily: BODY, fontSize: 21, opacity: 0.65, marginTop: 4 }}>{d[2]}</div>
            </div>
          );
        })}
      </div>
      <StatusBar ink={w.ink} />
      <Dock w={w} active="pass" />
    </div>
  );
}

/* ---------- the cursor / tap ---------- */

function Tap({ x, y, press, show }) {
  if (show <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(${x}px, ${y}px)`, opacity: show, zIndex: 30 }}>
      <div style={{ position: 'absolute', left: -22, top: -22, width: 44, height: 44, borderRadius: 999, background: 'rgba(243,240,233,0.9)', boxShadow: '0 6px 20px rgba(16,15,13,0.4)', transform: `scale(${1 - 0.25 * press})` }} />
      <div style={{ position: 'absolute', left: -70 * press, top: -70 * press, width: 140 * press, height: 140 * press, borderRadius: 999, border: '2px solid rgba(243,240,233,0.8)', opacity: 1 - press }} />
    </div>
  );
}

function Ornament({ w, progress }) {
  const p = clamp(progress, 0, 1);
  if (w.ornament === 'none') return null;
  if (w.ornament === 'silk') {
    return (
      <img
        src="/images/invitation-silk.webp"
        alt=""
        style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: `translate(190px, ${-580 + 26 * p}px) rotate(${9 - 5 * p}deg)`,
          width: 250, opacity: 0.95 * p, zIndex: 12,
        }}
      />
    );
  }
  /* the sprig exactly as the product draws it (guest-invitation-hero.tsx:
     one curved stem and seven closed leaves off a [y, dx, dy] table, the leaf
     root stepping in along the stem; strokeWidth 1.4, round caps) */
  const LEAVES = [
    [40, -34, -18], [78, 36, 20], [116, -40, -14], [154, 38, 16],
    [196, -34, -10], [238, 32, 14], [278, -26, -8],
  ];
  const stem = 1 - clamp(p * 1.5, 0, 1);
  return (
    <svg
      width="250" height="386" viewBox="0 0 220 340" fill="none"
      style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(255px, ${-600 + 20 * p}px) rotate(${8 - 5 * p}deg)`, zIndex: 12, opacity: p, color: w.accent }}
    >
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path
          d="M150 8c-24 44-44 96-52 150-8 54-4 116 14 174"
          pathLength="1" strokeDasharray="1" strokeDashoffset={stem}
        />
        {LEAVES.map((L, i) => {
          const y = L[0];
          const dx = L[1];
          const dy = L[2];
          const d =
            'M' + (132 - (y - 40) * 0.16) + ' ' + y +
            'c' + dx + ' ' + dy + ' ' + dx * 1.25 + ' ' + (dy + 26) + ' ' + dx * 0.5 + ' ' + (dy + 44) +
            'c-' + Math.abs(dx) * 0.55 + ' -' + (12 + dy * 0.2) +
            ' -' + Math.abs(dx) * 0.3 + ' -' + (30 + dy * 0.2) + ' 0 -' + (dy + 44) + 'Z';
          return (
            <path
              key={y}
              d={d}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - clamp(p * 1.7 - 0.25 - i * 0.09, 0, 1)}
            />
          );
        })}
      </g>
    </svg>
  );
}

/* ---------- A. Hook ---------- */

const CHAT = [
  { me: false, t: 'Wedding info!! 📎 bit.ly/j-and-m-2027' },
  { me: true, t: 'what time is the ceremony again' },
  { me: false, t: 'checking… is anyone doing a shuttle?' },
  { me: true, t: 'also can I bring Dan' },
];

function Hook({ T, CUES }) {
  const out = MOTION.enter(T, 0, 1, CUES.Stamp - 0.4, 0.5);
  const inP = MOTION.pop(T, 0, 1, 0.05, 0.7);
  const jitter = T < 2.3 ? Math.sin(T * 26) * 3.4 : 0;
  const head = MOTION.enter(T, 0, 1, 0.8, 0.7);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <Phone x={jitter} y={(1 - inP) * 130 - 300} rotate={-3 + jitter * 0.3} scale={(0.62 + 0.11 * inP) * (1 - 0.08 * out)}>
        <div style={{ position: 'absolute', inset: 0, background: '#141311', padding: '96px 30px 30px' }}>
          <div style={{ ...kick(18, 'rgba(243,240,233,0.45)'), marginBottom: 28 }}>Wedding group chat · 61</div>
          {CHAT.map((c, i) => {
            const p = MOTION.pop(T, 0, 1, 0.3 + i * 0.3, 0.6);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: c.me ? 'flex-end' : 'flex-start', marginBottom: 20, opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
                <div style={{ maxWidth: 430, background: c.me ? '#3b3a35' : '#221f1b', color: 'rgba(243,240,233,0.86)', fontFamily: BODY, fontSize: 27, lineHeight: 1.4, padding: '18px 22px', borderRadius: 24 }}>{c.t}</div>
              </div>
            );
          })}
        </div>
        <StatusBar ink="rgba(243,240,233,0.8)" />
      </Phone>
      {/* the other places the same information is living */}
      {[
        { t: 'guests_final_v4.xlsx', x: -468, y: -560, r: -8, at: 0.5 },
        { t: 'wedding-info.pdf', x: 250, y: -300, r: 7, at: 0.85 },
        { t: 'seating · printed 3 wks ago', x: -116, y: 250, r: -3, at: 1.15 },
      ].map((f) => {
        const p = MOTION.pop(T, 0, 1, f.at, 0.6);
        return (
          <div
            key={f.t}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(${f.x}px, ${f.y + (1 - p) * 40}px) rotate(${f.r}deg)`,
              padding: '16px 22px', background: 'rgba(243,240,233,0.92)', color: INK,
              fontFamily: BODY, fontSize: 22, fontWeight: 600, opacity: p * 0.92,
              maxWidth: 232, textAlign: 'center', lineHeight: 1.3,
              boxShadow: '0 20px 44px rgba(0,0,0,0.4)',
            }}
          >
            {f.t}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 80, right: 80, bottom: 130, opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
        <div style={{ ...kick(24, 'rgba(243,240,233,0.85)'), marginBottom: 26, ...tnum }}>
          {Math.round(61 * clamp(T / 1.2, 0, 1))} guests · {Math.round(14 * clamp(T / 1.4, 0, 1))} unread · 3 versions
        </div>
        <div style={{ fontFamily: BODONI, fontSize: 88, lineHeight: 1.04, color: '#f6f3ec', textShadow: '0 4px 40px rgba(0,0,0,0.55)' }}>
          This is how
          <br />
          your guests
          <br />
          will remember it.
        </div>
      </div>
    </div>
  );
}

/* ---------- B. Stamp: a real envelope, opened ---------- */

function Stamp({ T, CUES }) {
  const s = CUES.Stamp;
  const w = byId('riviera');
  const drop = MOTION.enter(T, 0, 1, s - 0.3, 0.6);
  const ring = MOTION.enter(T, 0, 1, s + 0.15, 0.7);
  const crack = MOTION.enter(T, 0, 1, s + 0.85, 0.8);
  const flap = MOTION.enter(T, 0, 1, s + 1.25, 0.8);
  const rise = MOTION.enter(T, 0, 1, s + 1.6, 1.0);
  const out = MOTION.enter(T, 0, 1, CUES.Reveal - 0.5, 0.7);
  const EW = 830;
  const EH = 570;
  const half = (dir) => (
    <div
      style={{
        position: 'absolute', inset: 0,
        clipPath: dir < 0 ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' : 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
        transform: `translate(${dir * 300 * crack}px, ${210 * crack}px) rotate(${dir * 34 * crack}deg)`,
        opacity: 1 - crack,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#5e5a34', boxShadow: 'inset 0 0 0 8px rgba(243,240,233,0.22)', display: 'grid', placeItems: 'center', fontFamily: BODONI, fontSize: 112, color: '#eee8dc' }}>
        E&nbsp;M
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <div
        style={{
          position: 'absolute', left: '50%', top: 1080, width: EW, height: EH, marginLeft: -EW / 2,
          transform: `translateY(${-EH / 2}px) scale(${(0.8 + 0.2 * drop) * (1 + 0.12 * out)})`,
          opacity: drop, perspective: 1600,
        }}
      >
        {/* the card rising out */}
        <div
          style={{
            position: 'absolute', left: 60, top: 40 - rise * 330, width: EW - 120, height: EH - 110,
            background: w.paper, border: `1px solid ${RULE}`, boxShadow: '0 24px 50px rgba(29,27,23,0.16)',
            opacity: rise, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 54, gap: 18,
          }}
        >
          <div style={{ ...kick(18, w.ink), opacity: 0.6 }}>{w.kicker}</div>
          <div style={{ fontFamily: w.font, fontSize: 74, color: w.ink }}>
            Elena <span style={{ opacity: 0.55 }}>&</span> Matteo
          </div>
        </div>
        {/* envelope body, printed with the world's stationery */}
        <div
          style={{
            position: 'absolute', inset: 0, background: '#efe9d9', border: `1px solid ${RULE}`,
            boxShadow: '0 34px 80px rgba(29,27,23,0.22)',
            backgroundImage: 'radial-gradient(circle at 14px 14px, rgba(64,97,122,0.16) 3px, transparent 3.4px)',
            backgroundSize: '52px 52px',
          }}
        />
        <div style={{ position: 'absolute', left: 100, top: 360, width: EW - 200, textAlign: 'center', opacity: 1 - flap }}>
          <div style={{ ...kick(17), marginBottom: 12 }}>Invitation for</div>
          <div style={{ fontFamily: w.font, fontSize: 48, color: w.ink }}>The Hartley Household</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
            <Brand size={15} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: EW, height: 275, transformOrigin: 'top center',
            transform: `rotateX(${-170 * flap}deg)`, background: '#e7dfce',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)', opacity: 1 - clamp((flap - 0.5) / 0.4, 0, 1),
          }}
        />
        <div style={{ position: 'absolute', left: EW / 2 - 115, top: 145, width: 230, height: 230 }}>
          {half(-1)}
          {half(1)}
        </div>
      </div>
      {ring > 0.03 && ring < 0.97 ? (
        <div
          style={{
            position: 'absolute', left: '50%', top: 840, width: 1500 * ring, height: 1500 * ring,
            marginLeft: -750 * ring, marginTop: -750 * ring, borderRadius: 999,
            border: `${9 * (1 - ring)}px solid rgba(111,116,73,0.55)`, opacity: (1 - ring) * 0.9,
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', left: 90, right: 90, top: 200, opacity: MOTION.enter(T, 0, 1, s + 1.5, 0.8) }}>
        <div style={{ fontFamily: BODONI, fontSize: 92, lineHeight: 1.04, color: INK }}>
          There is another
          <br />
          way to be invited.
        </div>
      </div>
    </div>
  );
}

/* ---------- C. Reveal: the invitation, on a phone, being read ---------- */

function Reveal({ T, CUES }) {
  const r = CUES.Reveal;
  const w = byId('riviera');
  const inP = MOTION.enter(T, 0, 1, r - 0.4, 1.0);
  const push = MOTION.drift(T, 0.98, 1.06, r, 4.4);
  const scroll = MOTION.drift(T, 0, 300, r + 1.5, 2.2);
  const crest = MOTION.enter(T, 0, 1, r + 0.7, 1.2);
  const out = MOTION.enter(T, 0, 1, CUES.Craft - 0.5, 0.6);
  const swipe = MOTION.drift(T, 0, 1, r + 1.4, 1.4);
  const tapShow = clamp(MOTION.enter(T, 0, 1, r + 1.1, 0.4) - MOTION.enter(T, 0, 1, r + 2.9, 0.4), 0, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inP * (1 - out) }}>
      <Phone y={40} scale={(0.92 + 0.08 * inP) * push} tiltY={(1 - inP) * -14} gloss={swipe}>
        <InvitationScreen w={w} scroll={scroll} crest={crest} />
      </Phone>
      <Tap x={90} y={300 - 420 * swipe} press={0} show={tapShow} />
      <div
        style={{
          position: 'absolute', left: 70, right: 70, bottom: 250, padding: '34px 40px 30px',
          background: PAPER, border: `1px solid ${RULE}`, boxShadow: '0 26px 60px rgba(29,27,23,0.16)',
          textAlign: 'center', opacity: MOTION.enter(T, 0, 1, r + 2.6, 0.7),
          transform: `translateY(${(1 - MOTION.enter(T, 0, 1, r + 2.6, 0.7)) * 26}px)`,
        }}
      >
        <div style={{ fontFamily: BODONI, fontSize: 60, lineHeight: 1.1, color: INK }}>
          Their whole wedding, in a link.
        </div>
        <div style={{ width: 90, height: 1, background: OLIVE, margin: '22px auto 18px' }} />
        <div style={{ ...kick(19, INK), opacity: 0.66 }}>No app · no account · no spreadsheet</div>
      </div>
    </div>
  );
}

/* ---------- D. Craft: the same screen, in four different worlds ---------- */

const CRAFT_ORDER = ['maison', 'notte', 'heritage', 'garden'];

function Craft({ T, CUES }) {
  const c = CUES.Craft;
  const step = 1.2;
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {CRAFT_ORDER.map((id, i) => {
        const w = byId(id);
        const at = c + i * step;
        const p = MOTION.enter(T, 0, 1, at, 0.42);
        const o = MOTION.enter(T, 0, 1, at + 1.06, 0.3);
        const vis = clamp(p - o, 0, 1);
        const scroll = MOTION.drift(T, 40, 210, at, 1.5);
        return (
          <div
            key={id}
            style={{
              position: 'absolute', inset: 0, opacity: vis,
              clipPath: `inset(0% 0% ${(1 - p) * 100}% 0%)`,
            }}
          >
            <Phone y={-30} scale={0.96 + 0.05 * p} rotate={(1 - p) * 2.5} tiltY={(1 - p) * -8} gloss={p}>
              <InvitationScreen w={w} scroll={scroll} crest={p} />
            </Phone>
            <Ornament w={w} progress={p} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 250, display: 'flex', justifyContent: 'center', gap: 14 }}>
              {[w.paper, w.accent, w.soft].map((col) => (
                <div key={col} style={{ width: 44, height: 44, borderRadius: 999, background: col, border: `1px solid ${RULE}` }} />
              ))}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center' }}>
              <div style={{ fontFamily: w.font, fontSize: 56, color: INK }}>{w.name}</div>
              <div style={{ width: 220 * p, height: 1, background: w.accent, margin: '18px auto 0' }} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute', left: 80, right: 80, top: 120, textAlign: 'center',
          opacity: MOTION.enter(T, 0, 1, c + 0.3, 0.6) * (1 - MOTION.enter(T, 0, 1, CUES.Works - 0.5, 0.5)),
        }}
      >
        <div style={{ fontFamily: BODONI, fontSize: 74, lineHeight: 1.06, color: INK }}>
          Six worlds. Six voices.
        </div>
        <div style={{ ...kick(20), marginTop: 14 }}>Paper · type · ornament · words</div>
      </div>
    </div>
  );
}

/* ---------- E. Works: the guest actually does things ---------- */

function Works({ T, CUES }) {
  const k = CUES.Works;
  const w = byId('riviera');
  const inP = MOTION.enter(T, 0, 1, k - 0.4, 0.7);
  const out = MOTION.enter(T, 0, 1, CUES.Planners - 0.6, 0.7);
  const toReply = MOTION.enter(T, 0, 1, k + 0.5, 0.45);
  const toPass = MOTION.enter(T, 0, 1, k + 2.9, 0.45);
  const tick = MOTION.enter(T, 0, 1, k + 1.1, 0.8);
  const chips = MOTION.enter(T, 0, 1, k + 1.9, 0.9);
  const qr = MOTION.pop(T, 0, 1, k + 3.3, 0.8);
  const rows = MOTION.enter(T, 0, 1, k + 3.6, 1.2);
  const press1 = clamp(MOTION.enter(T, 0, 1, k + 0.25, 0.35) - MOTION.enter(T, 0, 1, k + 0.6, 0.35), 0, 1);
  const press2 = clamp(MOTION.enter(T, 0, 1, k + 2.65, 0.35) - MOTION.enter(T, 0, 1, k + 3.0, 0.35), 0, 1);
  const zoom = MOTION.drift(T, 1.0, 1.07, k, 5.0);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inP * (1 - out) }}>
      <Phone y={30} scale={(0.94 + 0.06 * inP) * zoom} tiltY={(1 - inP) * -10} gloss={toPass}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <InvitationScreen w={w} scroll={300} crest={1} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: toReply, transform: `translateY(${(1 - toReply) * 120}px)` }}>
          <ReplyScreen w={w} tick={tick} chips={chips} />
        </div>
        <div style={{ position: 'absolute', inset: 0, opacity: toPass, transform: `translateY(${(1 - toPass) * 120}px)` }}>
          <PassScreen w={w} qr={qr} rows={rows} />
        </div>
      </Phone>
      <Tap x={-150} y={555} press={press1} show={clamp(press1 * 3, 0, 1)} />
      <Tap x={150} y={555} press={press2} show={clamp(press2 * 3, 0, 1)} />
      <div style={{ position: 'absolute', left: 80, right: 80, top: 110, textAlign: 'center' }}>
        <div style={{ fontFamily: BODONI, fontSize: 78, lineHeight: 1.04, color: INK, opacity: MOTION.enter(T, 0, 1, k, 0.6) }}>
          One reply. One pass.
        </div>
        <div style={{ ...kick(20), marginTop: 14, opacity: MOTION.enter(T, 0, 1, k + 0.5, 0.6) }}>
          Household, diet, shuttle, table, times
        </div>
      </div>
    </div>
  );
}

/* ---------- F. Planners: the Studio on one side, the guest on the other ---------- */

function StudioWindow({ T, CUES, activeIndex, rowsIn }) {
  const p = CUES.Planners;
  const swap = MOTION.enter(T, 0, 1, p + 1.7, 0.5);
  return (
    <div
      style={{
        position: 'absolute', left: 60, top: 560, width: 960, height: 700,
        background: PAPER, border: `1px solid ${RULE}`, boxShadow: '0 40px 90px rgba(16,15,13,0.35)',
        display: 'flex', overflow: 'hidden',
      }}
    >
      <div style={{ width: 250, borderRight: `1px solid ${RULE}`, padding: '26px 22px', background: '#f1eee6' }}>
        <div style={{ marginBottom: 10 }}><Brand size={21} /></div>
        <div style={{ ...kick(15), marginBottom: 22, marginTop: 18 }}>Studio</div>
        {['Hartley · Como', 'Bianchi · Rome', 'Okafor · Lisbon', 'Reyes · Oaxaca'].map((n, i) => (
          <div
            key={n}
            style={{
              fontFamily: BODY, fontSize: 20, padding: '14px 12px', marginBottom: 6,
              background: i === 0 ? OLIVE : 'transparent', color: i === 0 ? IVORY : INK,
              opacity: i === 0 ? 1 : 0.6,
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '26px 30px' }}>
        <div style={{ ...kick(15) }}>World</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 14 }}>
          {WORLDS.map((w, i) => {
            const on = i === activeIndex;
            return (
              <div key={w.id} style={{ border: on ? `2px solid ${OLIVE}` : `1px solid ${RULE}`, padding: 4 }}>
                <img src={w.img} alt="" style={{ width: '100%', height: 74, objectFit: 'cover', display: 'block', opacity: on ? 1 : 0.55 }} />
              </div>
            );
          })}
        </div>
        <div style={{ ...kick(15), marginTop: 30 }}>Guest list · one source</div>
        <div style={{ marginTop: 12 }}>
          {[['Rebecca & Tom Hartley', 'Accepted', 'Table 4'], ['Dan Ilori', 'Accepted', 'Table 4'], ['Marta Vidal', 'Awaiting', '—']].map((r, i) => {
            const e = clamp(rowsIn * 1.5 - i * 0.28, 0, 1);
            return (
              <div key={r[0]} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: `1px solid ${RULE}`, opacity: e, transform: `translateX(${(1 - e) * 24}px)` }}>
                <div style={{ flex: 2, fontFamily: BODY, fontSize: 22, color: i === 0 ? '#4e5233' : INK, fontWeight: i === 0 ? 600 : 400 }}>{r[0]}</div>
                <div style={{ flex: 1, fontFamily: BODY, fontSize: 20, color: r[1] === 'Accepted' ? '#4e5233' : MUTED }}>{r[1]}</div>
                <div style={{ flex: 1, fontFamily: BODY, fontSize: 20, textAlign: 'right', ...tnum }}>{r[2]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...kick(15), marginTop: 26, color: swap > 0.5 ? '#4e5233' : MUTED }}>
          Invitation · RSVP · travel · seating · documents
        </div>
      </div>
    </div>
  );
}

function Planners({ T, CUES }) {
  const p = CUES.Planners;
  const inP = MOTION.enter(T, 0, 1, p - 0.3, 0.8);
  const out = MOTION.enter(T, 0, 1, CUES.Worlds - 0.35, 0.7);
  const swap = MOTION.enter(T, 0, 1, p + 1.7, 0.5);
  const rowsIn = MOTION.enter(T, 0, 1, p + 0.8, 1.1);
  const wire = MOTION.enter(T, 0, 1, p + 1.2, 0.9);
  const w = swap > 0.5 ? byId('notte') : byId('riviera');
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#17150f', opacity: inP * (1 - out) }}>
      <div
        style={{
          position: 'absolute', left: 70, right: 70, top: 140,
          opacity: 1 - MOTION.enter(T, 0, 1, CUES.Worlds - 0.75, 0.4),
        }}
      >
        <div style={{ ...kick(24, 'rgba(243,240,233,0.55)'), marginBottom: 22 }}>Wedding planners</div>
        <div style={{ fontFamily: BODONI, fontSize: 78, lineHeight: 1.06, color: '#f6f3ec' }}>
          Set it once.
          <br />
          They meet it everywhere.
        </div>
      </div>
      <StudioWindow T={T} CUES={CUES} activeIndex={swap > 0.5 ? 2 : 0} rowsIn={rowsIn} />
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path
          d="M700 1040 C 850 1040, 850 1400, 700 1480"
          fill="none" stroke={OLIVE} strokeWidth="2" opacity="0.85"
          pathLength="1" strokeDasharray="1" strokeDashoffset={1 - wire}
        />
      </svg>
      <Phone x={130} y={560} scale={0.48} rotate={-2}>
        <InvitationScreen w={w} scroll={210} crest={1} />
      </Phone>
      {/* what the same guest list prints for the suppliers */}
      {[
        { t: 'Kitchen sheet', rows: ['84 covers · 6 dietary', 'Table 4 · no shellfish'], x: 40, y: 1340, r: -4, at: 2.2 },
        { t: 'Place cards', rows: ['84 names · alphabetical', 'Table · meal · note'], x: 700, y: 1420, r: 3, at: 2.5 },
      ].map((d) => {
        const e = MOTION.enter(T, 0, 1, p + d.at, 0.8);
        return (
          <div
            key={d.t}
            style={{
              position: 'absolute', left: d.x, top: d.y, width: 320,
              transform: `translateY(${(1 - e) * 40}px) rotate(${d.r}deg)`, opacity: e,
              background: PAPER, border: `1px solid ${RULE}`, padding: '22px 24px',
              boxShadow: '0 26px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ ...kick(14) }}>{d.t}</div>
            {d.rows.map((r) => (
              <div key={r} style={{ fontFamily: BODY, fontSize: 19, color: INK, borderTop: `1px solid ${RULE}`, marginTop: 12, paddingTop: 10, ...tnum }}>{r}</div>
            ))}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 70, right: 70, bottom: 60, ...kick(20, 'rgba(243,240,233,0.5)'), opacity: MOTION.enter(T, 0, 1, p + 2.9, 0.7) }}>
        Guests never make an account
      </div>
    </div>
  );
}

/* ---------- G. Worlds: six phones ---------- */

function WorldsWall({ T, CUES }) {
  const v = CUES.Worlds;
  const out = MOTION.enter(T, 0, 1, CUES.Call - 0.6, 0.6);
  const head = MOTION.enter(T, 0, 1, v - 0.05, 0.6);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <div style={{ position: 'absolute', left: 70, right: 70, top: 140, opacity: head, transform: `translateY(${(1 - head) * 24}px)` }}>
        <div style={{ fontFamily: BODONI, fontSize: 92, lineHeight: 1.02, color: INK }}>Six worlds.</div>
        <div style={{ fontFamily: BODONI, fontStyle: 'italic', fontSize: 56, color: '#4e5233', marginTop: 8 }}>
          Or one made for you.
        </div>
      </div>
      {WORLDS.map((w, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const e = MOTION.enter(T, 0, 1, v - 0.15 + i * 0.15, 0.8);
        const par = Math.sin(T * 0.55 + i * 1.1) * 12;
        return (
          <div key={w.id} style={{ position: 'absolute', inset: 0, opacity: e }}>
            <Phone
              x={(col - 1) * 300}
              y={row * 620 - 285 + (1 - e) * 50 + par}
              scale={0.34}
              rotate={(col - 1) * 1.5}
              tiltY={(col - 1) * 4}
              gloss={e}
            >
              <InvitationScreen w={w} scroll={200} crest={1} />
            </Phone>
          </div>
        );
      })}
      {/* all six labels in one layer, so no phone can paint over them */}
      {WORLDS.map((w, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const e = MOTION.enter(T, 0, 1, v - 0.15 + i * 0.15, 0.8);
        const par = Math.sin(T * 0.55 + i * 1.1) * 12;
        return (
          <div
            key={w.id + '-label'}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(${(col - 1) * 300 - 130}px, ${row * 620 - 20 + par}px)`,
              width: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 14, opacity: e,
            }}
          >
            <div style={{ fontFamily: w.font, fontSize: 32, color: INK }}>{w.name}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[w.paper, w.accent, w.soft].map((c2) => (
                <div key={c2} style={{ width: 14, height: 14, borderRadius: 999, background: c2, border: `1px solid ${RULE}` }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- H. Call ---------- */

function Call({ T, CUES, total }) {
  const c = CUES.Call;
  const w = byId('riviera');
  const inP = MOTION.enter(T, 0, 1, c - 0.2, 0.8);
  const a = MOTION.enter(T, 0, 1, c + 0.7, 0.7);
  const b = MOTION.enter(T, 0, 1, c + 1.1, 0.7);
  const note = MOTION.enter(T, 0, 1, c + 1.6, 0.7);
  const fade = MOTION.enter(T, 0, 1, total - 0.5, 0.5);
  const float = MOTION.drift(T, 0, -26, c, 3.4);
  const row = (p, label, action) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 26, padding: '30px 0', borderTop: `1px solid ${RULE}`, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={kick(21)}>{label}</div>
      <div style={{ fontFamily: BODONI, fontSize: 42, textAlign: 'right' }}>{action}</div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inP * (1 - fade) }}>
      <Phone x={210} y={-340 + float} scale={0.62} rotate={4}>
        <InvitationScreen w={w} scroll={150} crest={1} />
      </Phone>
      <Tap
        x={210}
        y={430}
        press={clamp(MOTION.enter(T, 0, 1, c + 2.2, 0.35) - MOTION.enter(T, 0, 1, c + 2.55, 0.35), 0, 1)}
        show={clamp(MOTION.enter(T, 0, 1, c + 2.0, 0.3) - MOTION.enter(T, 0, 1, c + 3.0, 0.4), 0, 1)}
      />
      <div style={{ position: 'absolute', left: 80, right: 80, top: 1010 }}>
        <Brand size={46} />
        <div style={{ width: 340 * MOTION.enter(T, 0, 1, c + 0.35, 0.8), height: 1, background: INK, opacity: 0.5, margin: '24px 0 28px' }} />
        <div style={{ fontFamily: BODONI, fontSize: 104, lineHeight: 0.98, color: INK }}>
          One guest list.
          <br />
          One invitation.
        </div>
        <div style={{ marginTop: 56 }}>
          {row(a, 'Newly engaged', 'Open the sample invitation')}
          {row(b, 'Planners', 'Walk through the Studio')}
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontSize: 28, color: MUTED, opacity: note }}>
          No account, no card, nothing to install — free while we are in early release.
        </div>
      </div>
    </div>
  );
}

/* ---------- the piece ---------- */

export default function AdScene() {
  const { T, CUES, authoredTotal } = useComposition();
  const dark = MOTION.enter(T, 0.42, 0, 0.02, 0.5);
  const bedZoom = MOTION.drift(T, 1.18, 1.04, 0, 2.6);
  const paper = MOTION.enter(T, 0, 1, CUES.Stamp + 0.2, 0.22);
  const endFade = MOTION.enter(T, 0, 1, authoredTotal - 0.45, 0.45);
  /* the mark is ivory exactly while a dark ground is on screen: before the paper
     floods in on the stamp, and across the Planners beat until its ink ground has
     finished fading (its own Shot runs to CUES.Worlds + 0.3) */
  const plannersGround =
    MOTION.enter(T, 0, 1, CUES.Planners - 0.3, 0.8) *
    (1 - MOTION.enter(T, 0, 1, CUES.Worlds - 0.35, 0.7));
  const onDark = T < CUES.Stamp + 0.42 || plannersGround > 0.55;
  /* one camera for the whole piece; a zoom's y is (960 - the frame point it centres on) */
  const cam = camAt(T, [
    { t: 0, s: 1.08 },
    { t: 2.3, s: 1.0 },
    { t: CUES.Stamp + 0.2, s: 1.3, y: -95 },
    { t: CUES.Stamp + 1.8, s: 1.02 },
    { t: CUES.Reveal + 0.5, s: 1.0 },
    { t: CUES.Reveal + 3.6, s: 1.12, y: -60 },
    { t: CUES.Craft, s: 1.0 },
    { t: CUES.Craft + 4.9, s: 1.05 },
    { t: CUES.Works + 0.9, s: 1.0 },
    { t: CUES.Works + 1.9, s: 1.42, y: 185, x: 40 },
    { t: CUES.Works + 2.7, s: 1.04 },
    { t: CUES.Works + 3.9, s: 1.45, y: 250, x: 120 },
    { t: CUES.Works + 5.2, s: 1.0 },
    { t: CUES.Planners + 0.4, s: 1.0 },
    { t: CUES.Planners + 2.6, s: 1.1, y: -70 },
    { t: CUES.Worlds - 0.2, s: 1.0 },
    { t: CUES.Worlds + 4.4, s: 1.07, y: -50 },
    { t: CUES.Call, s: 1.0 },
    { t: authoredTotal, s: 1.06 },
  ]);
  return (
    <div
      style={{ position: 'absolute', inset: 0, background: '#100f0d', overflow: 'hidden', color: INK, fontFamily: BODY }}
    >
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${cam.s}) translate(${cam.x}px, ${cam.y}px)` }}>
      <Shot from={0} to={CUES.Reveal}>
        <img src="/images/notte.webp" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${bedZoom})` }} />
        <div style={{ position: 'absolute', inset: 0, background: `rgba(16,15,13,${0.48 + dark})` }} />
      </Shot>

      <div style={{ position: 'absolute', inset: 0, background: IVORY, opacity: paper }} />

      <Shot from={0} to={CUES.Stamp + 0.4}><Hook T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Stamp - 0.5} to={CUES.Reveal + 0.3}><Stamp T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Reveal - 0.6} to={CUES.Craft + 0.3}><Reveal T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Craft - 0.4} to={CUES.Works + 0.3}><Craft T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Works - 0.5} to={CUES.Planners + 0.3}><Works T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Planners - 0.5} to={CUES.Worlds + 0.3}><Planners T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Worlds - 0.4} to={CUES.Call + 0.3}><WorldsWall T={T} CUES={CUES} /></Shot>
      <Shot from={CUES.Call - 0.4} to={authoredTotal + 0.1}><Call T={T} CUES={CUES} total={authoredTotal} /></Shot>
      </div>

      {/* the wordmark rides along, ivory over the dark beats and ink over paper */}
      <div
        style={{
          position: 'absolute', left: 70, top: 74,
          opacity: clamp(MOTION.enter(T, 0, 1, 0.6, 0.8) - MOTION.enter(T, 0, 1, CUES.Call - 0.4, 0.5), 0, 1),
        }}
      >
        <Brand size={23} light={onDark} color={onDark ? undefined : INK} />
      </div>

      {/* film grain and a whisper of vignette, over everything */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(29,27,23,0.9) 1px, transparent 1.2px)',
          backgroundSize: '3px 3px',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(16,15,13,0.28) 100%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: '#100f0d', opacity: endFade, pointerEvents: 'none' }} />
    </div>
  );
}

export const AD_SCENES = [
  { name: "Hook", dur: 2.6 },
  { name: "Stamp", dur: 2.8 },
  { name: "Reveal", dur: 4.8 },
  { name: "Craft", dur: 5.2 },
  { name: "Works", dur: 5.6 },
  { name: "Planners", dur: 5.4 },
  { name: "Worlds", dur: 4.6 },
  { name: "Call", dur: 4 },
];

"use client";
/**
 * A small continuous-composition runtime, ported from the Claude Design
 * animation engine the brand explainer was authored in. One authored-time axis
 * (`T`, in seconds) drives everything; nothing mounts or unmounts at scene
 * boundaries. The stage renders at its authored pixel size and scales to fit
 * its container. It holds still on the last frame under reduced motion and
 * stops the clock while off-screen.
 */
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export const Easing = {
  linear: (t: number) => t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export const clamp = (value: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, value));

export const animate =
  ({
    from,
    to,
    start,
    end,
    ease = Easing.linear,
  }: {
    from: number;
    to: number;
    start: number;
    end: number;
    ease?: (t: number) => number;
  }) =>
  (T: number) =>
    from + (to - from) * ease(clamp((T - start) / (end - start || 1e-6)));

export type Scene = { name: string; dur: number };

type CompositionValue = {
  T: number;
  CUES: Record<string, number>;
  authoredTotal: number;
};

const CompositionContext = createContext<CompositionValue>({
  T: 0,
  CUES: {},
  authoredTotal: 0,
});

export const useComposition = () => useContext(CompositionContext);

function cueTable(scenes: Scene[]) {
  const CUES: Record<string, number> = {};
  let acc = 0;
  for (const scene of scenes) {
    if (!(scene.name in CUES)) CUES[scene.name] = acc;
    acc += scene.dur;
  }
  return { CUES, authoredTotal: acc };
}

export type CompositionHandle = {
  /** Jumps the authored clock straight to `t` seconds (clamped to the
      composition's length) — lets a page turn its own UI into a scrubber for
      the film, rather than only ever reading what's currently playing. */
  seek: (t: number) => void;
};

export const Composition = forwardRef<
  CompositionHandle,
  {
    scenes: Scene[];
    width: number;
    height: number;
    bg?: string;
    className?: string;
    children: ReactNode;
    /** Called with the authored second on every advance (and once, on the held
        frame, under reduced motion). Optional and backwards-compatible — lets a
        page react to what the composition is currently showing without needing
        the composition itself to know anything about the page. */
    onTick?: (T: number) => void;
    /** "contain" (default, unchanged): the stage keeps its authored aspect
        ratio and scales to the container's width. "cover" — opt-in only —
        fills whatever box the container is given (which must set its own
        height), cropping the composition the way `object-fit: cover` crops an
        image, for full-bleed placements. */
    fit?: "contain" | "cover";
  }
>(function Composition(
  {
    scenes,
    width,
    height,
    bg = "#f3f0e9",
    className,
    children,
    onTick,
    fit = "contain",
  },
  ref,
) {
  const { CUES, authoredTotal } = cueTable(scenes);
  const [T, setT] = useState(0);
  const [scale, setScale] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const onScreen = useRef(true);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;
  // Read and written by both the rAF loop and seek() below, so a seek takes
  // effect on the very next frame regardless of which one last touched it.
  const baseRef = useRef(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () =>
      setScale(
        fit === "cover"
          ? Math.max(el.clientWidth / width, el.clientHeight / height)
          : el.clientWidth / width,
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, fit]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen.current = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const held = Math.max(0, authoredTotal - 0.05);
      setT(held);
      onTickRef.current?.(held);
      return;
    }
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      if (!last) last = now;
      // Only advance while visible, so a scrolled-away hero costs nothing.
      if (onScreen.current) baseRef.current += now - last;
      last = now;
      const next = (baseRef.current / 1000) % authoredTotal;
      setT(next);
      onTickRef.current?.(next);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // The callback is read through a ref so changing page observers never
    // restarts the authored clock or changes this dependency array.
  }, [authoredTotal]);

  useImperativeHandle(
    ref,
    () => ({
      seek(t: number) {
        const next = ((t % authoredTotal) + authoredTotal) % authoredTotal;
        baseRef.current = next * 1000;
        setT(next);
        onTickRef.current?.(next);
      },
    }),
    [authoredTotal],
  );

  return (
    <div
      ref={wrap}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: fit === "cover" ? "100%" : undefined,
        aspectRatio: fit === "cover" ? undefined : `${width} / ${height}`,
        background: bg,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: fit === "cover" ? "50%" : 0,
          left: fit === "cover" ? "50%" : 0,
          width,
          height,
          transform:
            fit === "cover"
              ? `translate(-50%, -50%) scale(${scale})`
              : `scale(${scale})`,
          transformOrigin: fit === "cover" ? "center" : "top left",
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <CompositionContext.Provider value={{ T, CUES, authoredTotal }}>
          {children}
        </CompositionContext.Provider>
      </div>
    </div>
  );
});

/** Children stay mounted; they are only hidden outside their authored window. */
export function Shot({
  from,
  to,
  children,
}: {
  from: number;
  to: number;
  children: ReactNode;
}) {
  const { T } = useComposition();
  const visible = T >= from && T <= to;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

export type Caption = { at: number; until?: number; text: string };

export function Captions({
  items,
  style,
}: {
  items: Caption[];
  style?: CSSProperties;
}) {
  const { T } = useComposition();
  const active = items.find((item, i) => {
    const until = item.until ?? items[i + 1]?.at ?? Infinity;
    return T >= item.at && T < until;
  });
  if (!active) return null;
  const until = active.until ?? Infinity;
  const fade =
    clamp((T - active.at) / 0.4) *
    (Number.isFinite(until) ? clamp((until - T) / 0.4) : 1);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        padding: "0 8%",
        ...style,
      }}
    >
      <span style={{ opacity: fade }}>{active.text}</span>
    </div>
  );
}

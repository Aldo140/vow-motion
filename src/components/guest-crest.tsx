import type { World } from "@/lib/types";

// The engraved crest: an oval cartouche holding the couple's initials, drawn
// as hairlines so it reads as pressed into the paper rather than printed on
// it. Modernist keeps the same proportions with the ornament stripped out.
export default function GuestCrest({
  names,
  world,
  className = "",
  size = 132,
  monogram = "",
}: {
  names: string;
  world: World;
  className?: string;
  size?: number;
  monogram?: string;
}) {
  const initials = names
    .split(" & ")
    .map((name) => name.trim()[0])
    .filter(Boolean);
  const plain = world === "modernist";
  return (
    <span
      className={"guest-crest " + (plain ? "crest-plain " : "") + className}
      style={{ width: size, height: (size * 260) / 200 }}
    >
      <svg
        viewBox="0 0 200 260"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        {plain ? (
          <>
            <rect
              className="crest-line"
              x="30"
              y="34"
              width="140"
              height="192"
            />
            <rect
              className="crest-line crest-inner"
              x="39"
              y="43"
              width="122"
              height="174"
            />
          </>
        ) : (
          <>
            <ellipse className="crest-line" cx="100" cy="130" rx="70" ry="96" />
            <ellipse
              className="crest-line crest-inner"
              cx="100"
              cy="130"
              rx="61"
              ry="86"
            />
            {/* Crown and base scrolls, mirrored about the centre line. */}
            <path
              className="crest-line crest-ornament"
              d="M100 34c-9-9-20-13-30-9 6 3 9 8 9 14M100 34c9-9 20-13 30-9-6 3-9 8-9 14M100 22v12"
            />
            <path
              className="crest-line crest-ornament"
              d="M100 226c-9 9-20 13-30 9 6-3 9-8 9-14M100 226c9 9 20 13 30 9-6-3-9-8-9-14M100 238v-12"
            />
            {/* Side curls at the widest point of the oval. */}
            <path
              className="crest-line crest-ornament"
              d="M30 130c-9-6-15-2-15 5s7 9 11 4M170 130c9-6 15-2 15 5s-7 9-11 4"
            />
            <circle className="crest-dot" cx="100" cy="44" r="1.6" />
            <circle className="crest-dot" cx="100" cy="216" r="1.6" />
            <circle className="crest-dot" cx="39" cy="130" r="1.6" />
            <circle className="crest-dot" cx="161" cy="130" r="1.6" />
          </>
        )}
      </svg>
      <span className="crest-initials" aria-hidden="true">
        {monogram ? (
          <b
            style={{
              fontSize: Math.min(
                size * 0.26,
                (size * 0.8) / Math.max(1, monogram.length),
              ),
            }}
          >
            {monogram}
          </b>
        ) : initials.length > 1 ? (
          <>
            <b>{initials[0]}</b>
            <i>{plain ? "+" : "&"}</i>
            <b>{initials.slice(1).join("")}</b>
          </>
        ) : (
          <b>{initials[0]}</b>
        )}
      </span>
    </span>
  );
}

/** Hand-drawn stationery artwork. Fixed specimens, never generated particles.
 * SVG groups preserve the relationship between stem, calyx and each flower.
 * All artwork is decorative; words and controls stay in the invitation DOM. */
function Blossom({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  bud = false,
}: {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  bud?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      {bud ? (
        <>
          <path
            className="blossom-bud"
            d="M0 4C-13-6-11-19-3-22L1-19 5-23C15-17 12-3 0 4Z"
          />
          <path
            className="blossom-vein"
            d="M0 3C-4-5-3-12 1-19M0 4 7-2M0 4-6-2"
          />
        </>
      ) : (
        <g className="blossom-bloom">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <g
              key={angle}
              transform={`rotate(${angle + [0, -5, 3, -3, 4][i]}) scale(${[1, 0.87, 1.06, 0.94, 0.9][i]} 1)`}
            >
              <path
                className={`blossom-petal blossom-petal-${i % 2}`}
                d="M0 3C-5-1-15-9-16-18-17-23-13-28-8-28-4-28-2-25 0-23 3-27 7-29 11-27 17-24 18-20 15-14 11-7 5-1 0 3Z"
              />
              <path
                className="blossom-vein"
                d="M0 0C-4-8-9-14-10-20M0 0C3-7 7-13 9-19M-2-5C-8-9-12-14-13-19M2-5C8-10 11-15 12-20M0-3-2-18M-3-9-5-23M3-8 5-22"
              />
            </g>
          ))}
          <g className="blossom-stamens" fill="none">
            <path d="M0 1Q-2-5-7-9M0 1Q3-5 2-12M0 1Q7 0 10-5M0 1Q4 8 9 7M0 1Q-4 7-3 11M0 1Q-6 0-11 3M0 0-5-13M0 0 7-11M0 0 13 1M0 0 4 12M0 0-9 8M0 0-12-4" />
            {[
              [-7, -9],
              [2, -12],
              [10, -5],
              [9, 7],
              [-3, 11],
              [-11, 3],
              [-5, -13],
              [7, -11],
              [13, 1],
              [4, 12],
              [-9, 8],
              [-12, -4],
            ].map(([cx, cy]) => (
              <circle key={`${cx},${cy}`} cx={cx} cy={cy} r=".95" />
            ))}
          </g>
          <circle className="blossom-heart" r="2.2" cy="1" />
        </g>
      )}
    </g>
  );
}

const blooms = [
  [109, 94, 0.8, -26],
  [156, 103, 1, 12],
  [197, 130, 0.83, 40],
  [206, 191, 1.08, -12],
  [252, 168, 0.78, 22],
  [300, 206, 1.05, 38],
  [336, 140, 0.85, -7],
  [350, 99, 0.7, 18],
  [398, 191, 0.92, -32],
  [413, 266, 1.16, 4],
  [448, 225, 0.82, 31],
  [491, 303, 0.86, -20],
  [238, 277, 0.95, 19],
  [289, 292, 0.72, -14],
  [138, 215, 0.72, 12],
] as const;

export function CherryBlossomBranch({
  className = "",
  budding = false,
}: {
  className?: string;
  budding?: boolean;
}) {
  return (
    <svg
      className={`cherry-branch ${className}`}
      viewBox="0 0 640 480"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="cherry-wood">
        <path
          className="cherry-trunk"
          d="M650 462C576 407 520 363 461 320L452 316C411 283 366 252 321 222L313 218C254 178 182 134 107 86 186 132 257 176 317 215L325 219C370 249 415 279 456 311L465 316C524 358 580 402 650 455Z"
        />
        <path d="M430 290C403 250 388 201 359 145L350 99M396 261C398 221 418 216 448 225M323 218C292 218 266 200 252 168M280 193C266 167 281 145 282 124M279 192C239 191 219 200 188 214L138 215M372 254C342 282 289 282 238 277M505 341C506 321 499 308 491 303M199 143C183 110 165 101 156 103M154 115 109 94" />
        <path
          className="cherry-twig"
          d="M359 145 336 140M399 219 398 191M306 279 289 292M244 191 206 191M220 156 197 130M191 213 172 239M282 124 267 111M107 86 82 60"
        />
        <path
          className="cherry-bark"
          d="M618 435 601 422M537 374 524 364M470 322 461 317M411 281 403 275M357 243 351 238"
        />
      </g>
      {blooms.map(([x, y, scale, rotate], i) => (
        <Blossom
          key={i}
          x={x}
          y={y}
          scale={scale * (budding ? 0.6 : 0.72)}
          rotate={rotate}
          bud={budding && i % 4 !== 0}
        />
      ))}
      <Blossom x={82} y={60} scale={0.6} rotate={-40} bud />
      <Blossom x={267} y={111} scale={0.6} rotate={-20} bud />
      <Blossom x={172} y={239} scale={0.58} rotate={-125} bud />
    </svg>
  );
}

/** A pressed specimen for saved replies and occasional Studio milestones. */
export function CherryBlossomMark({
  className = "",
  budding = false,
}: {
  className?: string;
  budding?: boolean;
}) {
  return (
    <svg
      className={`cherry-mark ${className}`}
      viewBox="0 0 100 126"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="cherry-specimen-stem"
        d="M52 114C60 89 54 66 45 42M56 88 74 67M52 66 31 62"
      />
      <Blossom x={45} y={40} scale={0.9} rotate={-12} bud={budding} />
      <Blossom x={75} y={62} scale={0.42} rotate={29} bud />
      <path
        className="cherry-leaf"
        d="M53 86C35 87 24 77 24 67 37 65 50 73 53 86Z"
      />
      <path className="blossom-vein" d="M52 85 29 71" />
    </svg>
  );
}

export function CherryBlossomPetals({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`cherry-petals ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          className={`cherry-resting-petal petal-${index}`}
          viewBox="0 0 32 42"
          fill="none"
          focusable="false"
        >
          <path
            className="blossom-petal"
            d="M17 39C7 30 1 22 3 12 4 4 13 1 18 6L21 10 25 6C33 12 28 27 17 39Z"
          />
          <path className="blossom-vein" d="M17 37C14 28 13 21 15 14" />
        </svg>
      ))}
    </div>
  );
}

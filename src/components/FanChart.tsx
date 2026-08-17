import { ORIENTATIONS } from "@/lib/astigmatism";

type Props = {
  /** Rotation offset applied to the whole chart, in degrees. */
  rotation?: number;
  size?: number;
  /** Orientations (deg) behind options A, B, C; labelled at the chart rim. */
  optionOrientations?: number[];
};

const LETTERS = ["A", "B", "C"];

/**
 * Radiating fan chart: straight dark lines at fixed mathematical orientations
 * on a light background, with a central fixation dot. Rendered as SVG with a
 * square viewBox so it always stays circular and symmetrical.
 */
export function FanChart({ rotation = 0, size = 420, optionOrientations = [] }: Props) {
  const R = 200;
  const inner = 18;
  const chartInk = "#111111";
  const chartPaper = "#ffffff";

  return (
    <svg
      viewBox="-250 -250 500 500"
      width="100%"
      height="100%"
      role="img"
      aria-label="Fan chart with lines radiating in twelve orientations"
      shapeRendering="geometricPrecision"
      style={{
        maxWidth: size,
        maxHeight: size,
        aspectRatio: "1 / 1",
        display: "block",
        backgroundColor: chartPaper,
        colorScheme: "light",
        forcedColorAdjust: "none",
        isolation: "isolate",
      }}
    >
      <circle
        cx={0}
        cy={0}
        r={R + 12}
        fill={chartPaper}
        stroke="#707070"
        strokeWidth={1.5}
        style={{ fill: chartPaper, stroke: "#707070" }}
      />
      <g
        transform={`rotate(${rotation})`}
        fill="none"
        stroke={chartInk}
        strokeWidth={2.4}
        style={{ fill: "none", stroke: chartInk, strokeWidth: 2.4, opacity: 1 }}
      >
        {ORIENTATIONS.map((deg) => {
          // Each orientation is drawn as a small band of parallel-ish lines.
          return [-1, 0, 1].map((k) => {
            const spread = k * 2.2;
            const a = ((deg + spread) * Math.PI) / 180;
            const ax = Math.cos(a);
            const ay = Math.sin(a);
            return (
              <line
                key={`${deg}-${k}`}
                x1={ax * inner}
                y1={ay * inner}
                x2={ax * R}
                y2={ay * R}
                strokeLinecap="butt"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: chartInk, strokeWidth: 2.4, opacity: 1 }}
              />
            );
          });
        })}
        {ORIENTATIONS.map((deg) => {
          return [-1, 0, 1].map((k) => {
            const a = ((deg + 180 + k * 2.2) * Math.PI) / 180;
            return (
              <line
                key={`m-${deg}-${k}`}
                x1={Math.cos(a) * inner}
                y1={Math.sin(a) * inner}
                x2={Math.cos(a) * R}
                y2={Math.sin(a) * R}
                strokeLinecap="butt"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: chartInk, strokeWidth: 2.4, opacity: 1 }}
              />
            );
          });
        })}
      </g>
      {optionOrientations.map((deg, i) => {
        const a = ((deg + rotation) * Math.PI) / 180;
        return (
          <text
            key={`label-${i}`}
            x={Math.cos(a) * (R + 34)}
            y={Math.sin(a) * (R + 34)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={22}
            fontWeight={600}
            fill="currentColor"
          >
            {LETTERS[i]}
          </text>
        );
      })}
      <circle cx={0} cy={0} r={4} fill={chartInk} style={{ fill: chartInk }} />
    </svg>
  );
}

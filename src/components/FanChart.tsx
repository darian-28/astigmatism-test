import { ORIENTATIONS } from "@/lib/astigmatism";

type Props = {
  /** Rotation offset applied to the whole chart, in degrees. */
  rotation?: number;
  size?: number;
};

/**
 * Radiating fan chart: straight dark lines at fixed mathematical orientations
 * on a light background, with a central fixation dot. Rendered as SVG with a
 * square viewBox so it always stays circular and symmetrical.
 */
export function FanChart({ rotation = 0, size = 420 }: Props) {
  const R = 200;
  const inner = 18;

  return (
    <svg
      viewBox="-220 -220 440 440"
      width="100%"
      height="100%"
      role="img"
      aria-label="Fan chart with lines radiating in twelve orientations"
      style={{ maxWidth: size, maxHeight: size, aspectRatio: "1 / 1", display: "block" }}
    >
      <circle cx={0} cy={0} r={R + 12} fill="var(--chart-surface)" stroke="var(--chart-ring)" strokeWidth={1} />
      <g transform={`rotate(${rotation})`}>
        {ORIENTATIONS.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const dx = Math.cos(rad);
          const dy = Math.sin(rad);
          // Each orientation is drawn as a small band of parallel-ish lines.
          return [-1, 0, 1].map((k) => {
            const spread = k * 2.2;
            const a = ((deg + spread) * Math.PI) / 180;
            const ax = Math.cos(a);
            const ay = Math.sin(a);
            void dx;
            void dy;
            return (
              <line
                key={`${deg}-${k}`}
                x1={ax * inner}
                y1={ay * inner}
                x2={ax * R}
                y2={ay * R}
                stroke="var(--chart-line)"
                strokeWidth={1.6}
                strokeLinecap="butt"
              />
            );
          });
        })}
        {ORIENTATIONS.map((deg) => {
          const rad = ((deg + 180) * Math.PI) / 180;
          return [-1, 0, 1].map((k) => {
            const a = ((deg + 180 + k * 2.2) * Math.PI) / 180;
            void rad;
            return (
              <line
                key={`m-${deg}-${k}`}
                x1={Math.cos(a) * inner}
                y1={Math.sin(a) * inner}
                x2={Math.cos(a) * R}
                y2={Math.sin(a) * R}
                stroke="var(--chart-line)"
                strokeWidth={1.6}
              />
            );
          });
        })}
      </g>
      <circle cx={0} cy={0} r={4} fill="var(--chart-line)" />
    </svg>
  );
}

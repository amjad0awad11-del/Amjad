import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { palette } from "./theme";
import { TOTAL } from "./theme";

const BOKEH = [
  { x: 120, y: 320, r: 190, o: 0.16 },
  { x: 880, y: 180, r: 130, o: 0.12 },
  { x: 940, y: 1180, r: 220, o: 0.1 },
  { x: 180, y: 1520, r: 160, o: 0.13 },
];

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: palette.greenDeep }}>
      {/* slow drifting wash keeps the frame alive without pulling focus */}
      <Interactive.Div
        name="Wash"
        style={{
          position: "absolute",
          inset: "-12%",
          background: `radial-gradient(circle at 30% 22%, #3C5C46 0%, #243A2C 46%, #16241B 100%)`,
          translate: interpolate(frame, [0, TOTAL], ["-20px -10px", "20px 14px"], {
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          scale: interpolate(frame, [0, TOTAL], [1.04, 1.12], {
            output: "perceptual-scale",
          }),
        }}
      />
      {BOKEH.map((b, i) => (
        <Interactive.Div
          key={i}
          name={`Bokeh ${i + 1}`}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y,
            width: b.r * 2,
            height: b.r * 2,
            borderRadius: "50%",
            background: palette.sage,
            filter: "blur(70px)",
            opacity: b.o,
            translate: interpolate(
              frame,
              [0, TOTAL],
              ["0px 0px", `${i % 2 ? -34 : 34}px ${i % 2 ? 26 : -26}px`],
              { easing: Easing.bezier(0.4, 0, 0.6, 1) },
            ),
          }}
        />
      ))}
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

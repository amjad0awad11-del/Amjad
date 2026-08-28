import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Moon } from "../Moon";
import { fontFamily, palette } from "../theme";

const CAUSES = ["Salty dinners", "Not enough sleep", "Water retention"];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily }}>
      <Interactive.Div
        name="Moon held"
        style={{
          position: "absolute",
          top: 300,
          opacity: interpolate(frame, [0, 18, 118, 140], [0, 0.5, 0.5, 0.28], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 140], [1.05, 1.14], {
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        <Moon size={520} phase={0} glow={0.5} />
      </Interactive.Div>

      <Interactive.Div
        name="Cause list"
        style={{
          position: "absolute",
          top: 940,
          width: 880,
          display: "flex",
          flexDirection: "column",
          gap: 30,
          alignItems: "center",
        }}
      >
        {CAUSES.map((c, i) => (
          <Interactive.Div
            key={c}
            name={c}
            style={{
              fontSize: 62,
              fontWeight: 400,
              color: palette.cream,
              opacity: interpolate(frame, [8 + i * 20, 32 + i * 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              translate: interpolate(frame, [8 + i * 20, 40 + i * 20], ["0px 38px", "0px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            {c}
          </Interactive.Div>
        ))}
      </Interactive.Div>

      <Interactive.Div
        name="Payoff"
        style={{
          position: "absolute",
          top: 1306,
          width: 900,
          textAlign: "center",
          fontSize: 54,
          fontWeight: 600,
          lineHeight: 1.28,
          color: palette.gold,
          opacity: interpolate(frame, [62, 88], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [62, 94], ["0px 34px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        When lymph flow slows down,
        <br />
        your face is the first to show it.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

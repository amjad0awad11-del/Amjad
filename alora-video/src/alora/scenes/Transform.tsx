import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Moon } from "../Moon";
import { fontFamily, palette } from "../theme";

export const Transform: React.FC = () => {
  const frame = useCurrentFrame();

  // The signature beat: the moon wanes, and so does the puffiness.
  const phase = interpolate(frame, [10, 82], [0, 0.78], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily }}>
      <Interactive.Div
        name="Waning moon"
        style={{
          position: "absolute",
          top: 356,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 145], [1.02, 0.94], {
            easing: Easing.bezier(0.4, 0, 0.6, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        <Moon size={600} phase={phase} />
      </Interactive.Div>

      <Interactive.Div
        name="Transformation label"
        style={{
          position: "absolute",
          top: 1122,
          width: 900,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 300,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: palette.sage,
          opacity: interpolate(frame, [26, 50], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Full → Sculpted
      </Interactive.Div>

      <Interactive.Div
        name="Transformation headline"
        style={{
          position: "absolute",
          top: 1232,
          width: 960,
          textAlign: "center",
          fontSize: 116,
          fontWeight: 700,
          letterSpacing: -3,
          lineHeight: 1.06,
          color: palette.cream,
          opacity: interpolate(frame, [46, 74], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [46, 80], ["0px 42px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Lose the
        <br />
        moon face.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

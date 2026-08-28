import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Moon } from "../Moon";
import { fontFamily, palette } from "../theme";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
      <Interactive.Div
        name="Moon rise"
        style={{
          position: "absolute",
          top: 360,
          opacity: interpolate(frame, [0, 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 46], ["0px 90px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0, 46, 125], [0.86, 1, 1.05], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [Easing.bezier(0.16, 1, 0.3, 1), Easing.linear],
            output: "perceptual-scale",
          }),
        }}
      >
        <Moon size={560} phase={0} />
      </Interactive.Div>

      <Interactive.Div
        name="Headline"
        style={{
          position: "absolute",
          top: 1072,
          width: 880,
          textAlign: "center",
          fontSize: 138,
          fontWeight: 700,
          letterSpacing: -3,
          lineHeight: 1.02,
          color: palette.cream,
          opacity: interpolate(frame, [22, 46], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [22, 52], ["0px 44px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Moon face?
      </Interactive.Div>

      <Interactive.Div
        name="Subline"
        style={{
          position: "absolute",
          top: 1276,
          width: 820,
          textAlign: "center",
          fontSize: 50,
          fontWeight: 300,
          lineHeight: 1.34,
          color: palette.sage,
          opacity: interpolate(frame, [50, 74], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [50, 80], ["0px 30px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        That puffy, rounded look
        <br />
        in the mirror every morning.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

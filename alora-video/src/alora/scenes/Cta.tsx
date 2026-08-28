import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Bottle } from "../Bottle";
import { fontFamily, palette } from "../theme";

export const Cta: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily }}>
      <Interactive.Div
        name="Hero bottle"
        style={{
          position: "absolute",
          top: 250,
          opacity: interpolate(frame, [0, 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 40], [0.88, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
          }),
        }}
      >
        <Bottle height={760} />
      </Interactive.Div>

      <Interactive.Div
        name="Wordmark"
        style={{
          position: "absolute",
          top: 1140,
          fontSize: 130,
          fontWeight: 600,
          letterSpacing: -2,
          color: palette.cream,
          opacity: interpolate(frame, [20, 44], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [20, 50], ["0px 30px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Alora
      </Interactive.Div>

      <Interactive.Div
        name="Tagline"
        style={{
          position: "absolute",
          top: 1320,
          width: 900,
          textAlign: "center",
          fontSize: 46,
          fontWeight: 300,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: palette.gold,
          opacity: interpolate(frame, [40, 64], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Traditional lymphatic support
      </Interactive.Div>

      <Interactive.Div
        name="Pack facts"
        style={{
          position: "absolute",
          top: 1420,
          width: 900,
          textAlign: "center",
          fontSize: 36,
          fontWeight: 300,
          color: palette.sage,
          opacity: interpolate(frame, [54, 76], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        60ML / 2FL.OZ · Liquid herbal extracts
      </Interactive.Div>

      <Interactive.Div
        name="Disclaimer"
        style={{
          position: "absolute",
          top: 1612,
          width: 880,
          textAlign: "center",
          fontSize: 23,
          fontWeight: 300,
          lineHeight: 1.4,
          color: palette.sage,
          opacity: interpolate(frame, [66, 88], [0, 0.9], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        These statements have not been evaluated by the Food and Drug Administration. This product is
        not intended to diagnose, treat, cure or prevent any disease.
      </Interactive.Div>
    </AbsoluteFill>
  );
};

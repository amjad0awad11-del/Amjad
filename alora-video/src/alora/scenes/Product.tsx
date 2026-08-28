import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Bottle } from "../Bottle";
import { fontFamily, palette } from "../theme";

const CHIPS = ["Reduce Swelling", "Supports Energy", "Boosts Clarity", "Promotes Vitality"];

export const Product: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ alignItems: "center", fontFamily }}>
      {/* halo behind the bottle so the amber glass separates from the green */}
      <Interactive.Div
        name="Product halo"
        style={{
          position: "absolute",
          top: 268,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: palette.amberGlow,
          filter: "blur(120px)",
          opacity: interpolate(frame, [0, 40], [0, 0.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      <Interactive.Div
        name="Bottle"
        style={{
          position: "absolute",
          top: 200,
          opacity: interpolate(frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(frame, [0, 46], ["0px 150px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
          }),
          scale: interpolate(frame, [0, 46, 195], [0.9, 1, 1.03], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: [Easing.spring({ damping: 200 }), Easing.linear],
            output: "perceptual-scale",
          }),
        }}
      >
        <Bottle height={940} />
      </Interactive.Div>

      <Interactive.Div
        name="Product name"
        style={{
          position: "absolute",
          top: 1208,
          width: 940,
          textAlign: "center",
          fontSize: 66,
          fontWeight: 600,
          letterSpacing: -1,
          color: palette.cream,
          opacity: interpolate(frame, [46, 70], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [46, 76], ["0px 30px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        Lymphatic drainage drops
      </Interactive.Div>

      <Interactive.Div
        name="Benefit grid"
        style={{
          position: "absolute",
          top: 1358,
          width: 880,
          display: "flex",
          flexWrap: "wrap",
          gap: 22,
          justifyContent: "center",
        }}
      >
        {CHIPS.map((c, i) => (
          <Interactive.Div
            key={c}
            name={c}
            style={{
              width: 418,
              padding: "26px 0",
              textAlign: "center",
              fontSize: 40,
              fontWeight: 500,
              color: palette.cream,
              border: `2px solid ${palette.greenSoft}`,
              borderRadius: 999,
              background: "rgba(244,239,226,0.06)",
              opacity: interpolate(frame, [78 + i * 13, 100 + i * 13], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
              scale: interpolate(frame, [78 + i * 13, 104 + i * 13], [0.86, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1),
                output: "perceptual-scale",
              }),
            }}
          >
            {c}
          </Interactive.Div>
        ))}
      </Interactive.Div>
    </AbsoluteFill>
  );
};

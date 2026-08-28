import { AbsoluteFill, Easing, Interactive, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Product } from "./scenes/Product";
import { Transform } from "./scenes/Transform";
import { Cta } from "./scenes/Cta";
import { scenes } from "./theme";

const OVERLAP = 16;

/** Holds a scene on screen, then dissolves it into the next one. */
const Dissolve: React.FC<{ total: number; children: React.ReactNode }> = ({ total, children }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Dissolve"
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [total - OVERLAP, total], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

const Scene: React.FC<{
  name: string;
  from: number;
  duration: number;
  children: React.ReactNode;
}> = ({ name, from, duration, children }) => (
  <Sequence name={name} from={from} durationInFrames={duration + OVERLAP} layout="none">
    <Dissolve total={duration + OVERLAP}>{children}</Dissolve>
  </Sequence>
);

export const AloraAd: React.FC = () => {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Scene name="1 · Hook" {...scenes.hook}>
        <Hook />
      </Scene>
      <Scene name="2 · Problem" {...scenes.problem}>
        <Problem />
      </Scene>
      <Scene name="3 · Product" {...scenes.product}>
        <Product />
      </Scene>
      <Scene name="4 · Transformation" {...scenes.transform}>
        <Transform />
      </Scene>
      <Scene name="5 · Brand" {...scenes.cta}>
        <Cta />
      </Scene>
    </AbsoluteFill>
  );
};

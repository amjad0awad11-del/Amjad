import "./index.css";
import { Composition } from "remotion";
import { AloraAd } from "./alora/AloraAd";
import { TOTAL } from "./alora/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AloraMoonFace"
        component={AloraAd}
        durationInFrames={TOTAL}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

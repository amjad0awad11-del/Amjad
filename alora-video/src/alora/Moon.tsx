import { Interactive } from "remotion";

/**
 * The brand device: a moon that wanes from full (puffy) to crescent (sculpted).
 * `phase` 0 = full moon, 1 = thin crescent.
 */
export const Moon: React.FC<{
  size: number;
  phase: number;
  glow?: number;
}> = ({ size, phase, glow = 1 }) => {
  // Shadow circle slides left across the disc to carve the crescent.
  const shadowX = 100 + 190 - phase * 130;

  return (
    <Interactive.Svg
      name="Moon"
      viewBox="0 0 200 200"
      style={{
        width: size,
        height: size,
        overflow: "visible",
        filter: `drop-shadow(0 0 ${60 * glow}px rgba(226, 214, 178, ${0.55 * glow}))`,
      }}
    >
      <defs>
        <radialGradient id="moonFace" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#FBF7EA" />
          <stop offset="55%" stopColor="#F0E7CF" />
          <stop offset="100%" stopColor="#D9CBA6" />
        </radialGradient>
        <mask id="moonPhase">
          <rect x="0" y="0" width="200" height="200" fill="black" />
          <circle cx="100" cy="100" r="88" fill="white" />
          <circle cx={shadowX} cy="100" r="88" fill="black" />
        </mask>
      </defs>

      <g mask="url(#moonPhase)">
        <circle cx="100" cy="100" r="88" fill="url(#moonFace)" />
        {/* Craters — subtle, keeps it reading as a moon not a dot */}
        <circle cx="74" cy="72" r="15" fill="#D6C7A0" opacity={0.5} />
        <circle cx="112" cy="118" r="21" fill="#D6C7A0" opacity={0.38} />
        <circle cx="70" cy="128" r="9" fill="#D6C7A0" opacity={0.42} />
        <circle cx="126" cy="66" r="7" fill="#D6C7A0" opacity={0.3} />
      </g>
    </Interactive.Svg>
  );
};

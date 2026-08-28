import { Interactive } from "remotion";
import { fontFamily, palette } from "./theme";

const BENEFITS = ["Supports\nEnergy", "Boosts\nClarity", "Reduce\nSwelling", "Promotes\nVitality"];

/** Amber dropper bottle, drawn entirely in code — no packshot required. */
export const Bottle: React.FC<{ height: number }> = ({ height }) => {
  return (
    <Interactive.Svg
      name="Bottle"
      viewBox="0 0 400 1000"
      style={{ height, width: (height * 400) / 1000, overflow: "visible" }}
    >
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A2406" />
          <stop offset="16%" stopColor="#8A4711" />
          <stop offset="37%" stopColor="#CE8733" />
          <stop offset="58%" stopColor="#9A551A" />
          <stop offset="86%" stopColor="#5C2E08" />
          <stop offset="100%" stopColor="#401E05" />
        </linearGradient>
        <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#141414" />
          <stop offset="30%" stopColor="#3A3A3A" />
          <stop offset="60%" stopColor="#1E1E1E" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </linearGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* contact shadow */}
      <ellipse cx="200" cy="992" rx="150" ry="16" fill="#1C2F24" opacity="0.22" />

      {/* --- cap --- */}
      <rect x="118" y="10" width="164" height="34" rx="16" fill="#0E0E0E" />
      <rect x="112" y="30" width="176" height="204" rx="12" fill="url(#capGrad)" />
      {Array.from({ length: 15 }).map((_, i) => (
        <rect
          key={i}
          x={122 + i * 11.4}
          y={38}
          width="4"
          height="188"
          rx="2"
          fill="#FFFFFF"
          opacity={0.06}
        />
      ))}
      <rect x="104" y="232" width="192" height="30" rx="9" fill="#151515" />

      {/* --- neck + glass body --- */}
      <rect x="152" y="258" width="96" height="66" fill="#6B380D" />
      <path
        d="M62 424 Q62 344 124 322 L276 322 Q338 344 338 424 L338 950 Q338 984 304 984 L96 984 Q62 984 62 950 Z"
        fill="url(#glass)"
      />
      {/* pipette visible through the glass */}
      <rect x="192" y="330" width="16" height="300" rx="8" fill="#3A1B04" opacity="0.55" />
      {/* glass sheen */}
      <path d="M92 360 Q86 420 88 700 L120 700 Q116 420 126 352 Z" fill="url(#sheen)" />

      {/* --- label --- */}
      <rect x="74" y="452" width="252" height="470" rx="7" fill={palette.cream} />
      <rect x="74" y="452" width="252" height="60" rx="7" fill={palette.green} />
      <rect x="74" y="884" width="252" height="38" rx="7" fill={palette.green} />

      <g fontFamily={fontFamily} textAnchor="middle">
        <text x="200" y="494" fontSize="38" fontWeight="600" fill={palette.cream}>
          Alora
        </text>
        <text x="200" y="576" fontSize="41" fontWeight="500" fill={palette.green}>
          lymphatic
        </text>
        <text x="200" y="622" fontSize="45" fontWeight="700" fill={palette.green}>
          drainage
        </text>
        <text x="200" y="654" fontSize="14.5" fontWeight="400" letterSpacing="1.1" fill={palette.green}>
          LIQUID HERBAL EXTRACTS
        </text>

        {BENEFITS.map((b, i) => {
          const cx = 118 + i * 55;
          return (
            <g key={b}>
              <circle cx={cx} cy="716" r="18" fill="none" stroke={palette.ink} strokeWidth="1.6" />
              <circle cx={cx} cy="716" r="6.5" fill={palette.ink} opacity="0.6" />
              {b.split("\n").map((line, j) => (
                <text key={line} x={cx} y={754 + j * 12} fontSize="9.5" fill={palette.ink}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        <rect
          x="96"
          y="792"
          width="208"
          height="34"
          rx="3"
          fill="none"
          stroke={palette.ink}
          strokeWidth="1.4"
        />
        <text x="200" y="814" fontSize="12" letterSpacing="0.4" fill={palette.ink}>
          TRADITIONAL LYMPHATIC SUPPORT
        </text>
        <text x="200" y="866" fontSize="11.5" fill={palette.ink}>
          NET:60ML/2FL.OZ | DIETARY SUPPLEMENT
        </text>
      </g>
    </Interactive.Svg>
  );
};

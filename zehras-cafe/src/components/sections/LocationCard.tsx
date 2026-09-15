import { MapPin } from "lucide-react";
import { besuch } from "@/content/cafe";

/**
 * Abstract, branded location card.
 *
 * This is deliberately NOT a Google map: no map tiles, no Maps screenshot and
 * no Street View imagery, all of which would need a licensed Maps API setup
 * plus visible attribution. It is a decorative illustration that suggests a
 * town-centre street grid, with the real address rendered as text beside it and
 * a "Route planen" link doing the actual navigation work.
 */
export function LocationCard() {
  return (
    <div className="relative overflow-hidden rounded-[var(--r-card)] border border-[var(--hairline)] bg-[var(--ceramic)] shadow-[var(--shadow-md)]">
      <svg
        viewBox="0 0 640 420"
        className="h-full w-full"
        role="img"
        aria-label="Stilisierte Illustration der Lage im Zentrum von Moers"
      >
        <defs>
          <linearGradient id="loc-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFCF7" />
            <stop offset="100%" stopColor="#F4EADB" />
          </linearGradient>
          <radialGradient id="loc-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C8863C" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#C8863C" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="640" height="420" fill="url(#loc-ground)" />

        {/* Blocks — suggested built form, no real cartography. */}
        <g fill="#3A2A20" opacity="0.055">
          <rect x="44" y="52" width="150" height="104" rx="8" />
          <rect x="228" y="36" width="118" height="82" rx="8" />
          <rect x="386" y="58" width="176" height="96" rx="8" />
          <rect x="60" y="214" width="122" height="132" rx="8" />
          <rect x="404" y="212" width="160" height="126" rx="8" />
        </g>

        {/* Streets */}
        <g
          stroke="#3A2A20"
          strokeOpacity="0.16"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M0 186 H640" />
          <path d="M0 196 H640" strokeOpacity="0.07" />
          <path d="M208 0 V420" />
          <path d="M370 0 V420" strokeOpacity="0.1" />
          <path d="M0 360 H640" strokeOpacity="0.1" />
        </g>

        {/* The one street we do name — drawn in the brand caramel. */}
        <path
          d="M0 191 H640"
          stroke="#C8863C"
          strokeOpacity="0.55"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Sage green — a park / square, keeping the composition from reading
            as pure infrastructure. */}
        <rect
          x="238"
          y="228"
          width="118"
          height="104"
          rx="14"
          fill="#8FA382"
          fillOpacity="0.3"
        />

        <circle cx="320" cy="191" r="76" fill="url(#loc-halo)" />
        <circle cx="320" cy="191" r="13" fill="#3A2A20" />
        <circle cx="320" cy="191" r="5" fill="#FFFCF7" />
      </svg>

      {/* Real, selectable text over the illustration. */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[var(--r-media)] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--ceramic)_92%,transparent)] px-4 py-3 backdrop-blur-[3px]">
        <MapPin
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="shrink-0 text-[var(--caramel-deep)]"
        />
        <div>
          <p className="text-[0.9375rem] font-semibold text-[var(--espresso)]">
            {besuch.locationCard.label}
          </p>
          <p className="text-[0.8125rem] text-[var(--muted)]">
            {besuch.locationCard.district} · {besuch.locationCard.note}
          </p>
        </div>
      </div>
    </div>
  );
}

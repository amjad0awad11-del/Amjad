import {
  GOOGLE_MAPS_LISTING,
  SITE_URL,
  business,
  gaestestimmen,
  openingHours,
  seo,
  socialLinks,
} from "@/content/cafe";

/**
 * LocalBusiness structured data for the café.
 *
 * ONLY confirmed data is emitted. Every optional block below is gated on the
 * corresponding value actually existing in the content file, because a wrong
 * `openingHoursSpecification` or an invented `aggregateRating` is worse for the
 * business than no structured data at all — Google treats unverifiable markup
 * as a quality signal against the site.
 *
 * Deliberately absent until confirmed: telephone, openingHoursSpecification,
 * aggregateRating, review, priceRange, menu, servesCuisine specifics,
 * deliveryMethod and any amenity flags.
 */
export function JsonLd() {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    // CafeOrCoffeeShop is the precise subtype of Restaurant/FoodEstablishment
    // for this business; listing both makes the primary type unambiguous.
    "@type": ["CafeOrCoffeeShop", "Restaurant"],
    "@id": `${SITE_URL}/#cafe`,
    name: business.name,
    description: seo.description,
    url: SITE_URL,
    // The Google listing, which is the source of truth for the address.
    hasMap: GOOGLE_MAPS_LISTING,
    image: [`${SITE_URL}${seo.ogImage.src}`],
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      postalCode: business.address.postalCode,
      addressLocality: business.address.city,
      addressCountry: business.address.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.geo.latitude,
      longitude: business.geo.longitude,
    },
    areaServed: {
      "@type": "City",
      name: business.address.city,
    },
  };

  if (business.phone) {
    jsonLd.telephone = business.phone.dial;
  }

  if (business.email) {
    jsonLd.email = business.email;
  }

  if (openingHours.length > 0) {
    jsonLd.openingHoursSpecification = openingHours
      // Closed days carry no opens/closes, so they are simply omitted rather
      // than emitted as a zero-length window.
      .filter((entry) => entry.opens && entry.closes)
      .map((entry) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${entry.schemaDay}`,
        opens: entry.opens,
        closes: entry.closes,
      }));
  }

  if (socialLinks.length > 0) {
    jsonLd.sameAs = socialLinks.map((link) => link.href);
  }

  // Ratings are emitted only when the real figures are in the content file.
  if (
    typeof gaestestimmen.rating === "number" &&
    typeof gaestestimmen.reviewCount === "number" &&
    gaestestimmen.reviewCount > 0
  ) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: gaestestimmen.rating,
      reviewCount: gaestestimmen.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      // Escaping "<" is the documented way to keep a stray HTML tag inside any
      // content string from breaking out of the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

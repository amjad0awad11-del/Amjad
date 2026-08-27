import { meta, faq, leistungen } from "@/content/de";
import { containsPlaceholder } from "@/lib/placeholder";

/**
 * ProfessionalService + FAQPage structured data.
 *
 * Anything still carrying a [[PLACEHOLDER]] is left out rather than published
 * as fact — an unfilled token in structured data is worse than a missing field.
 */
export function JsonLd() {
  const sameAs = [meta.instagram, meta.whatsapp].filter((url) => !containsPlaceholder(url));

  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: meta.siteName,
    url: meta.domain,
    description: meta.description,
    image: `${meta.domain}/images/og.jpg`,
    inLanguage: "de",
    areaServed: meta.areaServed.map((code) => ({ "@type": "Country", name: code })),
    serviceType: meta.serviceTypes,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(containsPlaceholder(meta.email)
      ? {}
      : {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "sales",
            email: meta.email,
            availableLanguage: ["de"],
          },
        }),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: leistungen.title,
      itemListElement: leistungen.items.map((item) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: item.title, description: item.text },
      })),
    },
  };

  const answered = faq.items.filter((item) => !containsPlaceholder(item.a));

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }}
      />
      {answered.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
  );
}

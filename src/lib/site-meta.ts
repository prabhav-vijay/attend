const SHARE_IMAGE_PATH = "/attend-social.png";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export function pageHead({
  title,
  description,
  path,
  origin,
  jsonLd,
  includeShareImage = false,
}: {
  title: string;
  description: string;
  path: string;
  origin?: string;
  jsonLd?: JsonLd;
  includeShareImage?: boolean;
}) {
  const image = origin && includeShareImage ? `${origin}${SHARE_IMAGE_PATH}` : undefined;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      ...(image
        ? [
            { property: "og:image", content: image },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            { property: "og:image:alt", content: "Attend.™ college attendance calendar" },
          ]
        : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(image
        ? [
            { name: "twitter:image", content: image },
            { name: "twitter:image:alt", content: "Attend.™ college attendance calendar" },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: path }],
    scripts: jsonLd
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(jsonLd),
          },
        ]
      : undefined,
  };
}

export function breadcrumbJsonLd(origin: string, items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path}`,
    })),
  };
}
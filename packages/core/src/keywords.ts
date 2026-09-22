// Divar's public search endpoints only reliably filter by category + city (see
// worker/src/divar-discovery.ts for why), not free-text query. This local keyword
// filter is the safety net that actually narrows a category feed down to radios.

export const DEFAULT_RADIO_KEYWORDS = [
  "رادیو",
  "گرام",
  "گراموفون",
  "پیکاپ",
  "پیک آپ",
  "ضبط قدیمی",
  "رادیو ضبط",
  "لامپی",
  "ترانزیستور",
  "ترانزیستوری",
];

// Normalizes Arabic/Persian character variants (ي/ی, ك/ک) so matches don't
// silently miss listings written with the "wrong" Unicode codepoint.
function normalize(text: string): string {
  return text.replace(/ي/g, "ی").replace(/ك/g, "ک").trim().toLowerCase();
}

export function matchesKeywords(
  title: string,
  keywords: string[] = DEFAULT_RADIO_KEYWORDS
): boolean {
  const normalizedTitle = normalize(title);
  return keywords.some((keyword) => normalizedTitle.includes(normalize(keyword)));
}

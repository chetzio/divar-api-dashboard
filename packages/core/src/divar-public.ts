// Unofficial: Divar's own public "postlist" feed, NOT the documented Kenar API.
// Kenar's finder/post search is capped at 100 calls for the app's entire lifetime
// (see docs/post/search_post.md in divar-ir/kenar-docs), which makes it unusable
// for routine polling - so this hits the same endpoint divar.ir's own site calls.
//
// CONFIRMED (2026-09-22, tested live from a real server - the local dev sandbox
// has no outbound internet at all, so this couldn't be verified until now): the
// real request shape nests everything under `search_data`, not the `json_schema`
// key originally guessed here. Free-text search goes in `search_data.query` and
// is genuinely respected server-side - tested against "رادیو قدیمی" and got 25
// clearly relevant listings out of 27 results. City restriction is `city_ids`
// (numeric strings) at the top level, not city slugs - see CITY_SLUG_TO_ID below.
// Omitting `city_ids` entirely searches nationwide (confirmed: results spanned
// Tehran, Mashhad, Shiraz, Karaj, etc. in one no-city-ids test).
//
// Reference for this shape: github.com/shojaee76-cmyk/divar-mcp's client.py,
// cross-checked empirically rather than trusted blindly.
//
// Kept deliberately low-frequency (one household's polling, not a scraping
// service) - see worker/src/divar-discovery.ts for the interval/backoff logic.

const FEED_URL = "https://api.divar.ir/v8/postlist/w/search";

// id -> slug is how Divar's own data ships; inverted here since SavedSearch
// stores slugs (e.g. "tehran") but the API wants numeric city_ids.
const CITY_ID_BY_SLUG: Record<string, string> = {
  tehran: "1",
  karaj: "2",
  mashhad: "3",
  isfahan: "4",
  tabriz: "5",
  shiraz: "6",
  ahvaz: "7",
  qom: "8",
  kermanshah: "9",
  urmia: "10",
  zahedan: "11",
  rasht: "12",
  kerman: "13",
  hamedan: "14",
  arak: "15",
  yazd: "16",
  ardabil: "17",
  "bandar-abbas": "18",
  qazvin: "19",
  zanjan: "20",
  gorgan: "21",
  sari: "22",
  dezful: "23",
  abadan: "24",
  bushehr: "25",
  borujerd: "26",
  khorramabad: "27",
  sanandaj: "28",
  eslamshahr: "29",
  kashan: "30",
  najafabad: "31",
  ilam: "32",
  kish: "33",
  birjand: "34",
  semnan: "35",
  shahrekord: "36",
  "bandar-mahshahr": "37",
  yasuj: "38",
  bojnurd: "39",
};

export interface DivarFeedItem {
  token: string;
  title: string;
  price: number | null;
  city: string | null;
  district: string | null;
  imageUrl: string | null;
}

interface RawPostRow {
  widget_type: string;
  data?: {
    title?: string;
    image_url?: string;
    middle_description_text?: string; // formatted price, e.g. "۱۲,۰۰۰,۰۰۰ تومان"
    action?: {
      payload?: {
        token?: string;
        web_info?: {
          title?: string;
          city_persian?: string;
          district_persian?: string;
        };
      };
    };
  };
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Divar's search feed only gives price as a formatted Persian string, not a number. */
function parsePersianPrice(text: string | undefined): number | null {
  if (!text) return null;
  const latinDigits = text.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
  const digitsOnly = latinDigits.replace(/[^\d]/g, "");
  if (!digitsOnly) return null;
  const value = parseInt(digitsOnly, 10);
  return Number.isFinite(value) ? value : null;
}

export async function fetchDivarFeed(params: {
  query?: string;
  category?: string;
  cities?: string[]; // city slugs, e.g. ["tehran", "mashhad"]; omit/empty = nationwide
} = {}): Promise<DivarFeedItem[]> {
  const searchData: Record<string, unknown> = {};
  if (params.query) searchData.query = params.query;
  if (params.category) {
    searchData.form_data = { data: { category: { str: { value: params.category } } } };
  }

  const body: Record<string, unknown> = { search_data: searchData };

  const cityIds = (params.cities ?? [])
    .map((slug) => CITY_ID_BY_SLUG[slug.trim().toLowerCase()])
    .filter((id): id is string => Boolean(id));
  if (cityIds.length) body.city_ids = cityIds;

  const res = await fetch(FEED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; radiokar personal-use monitor)",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Divar feed request failed: ${res.status}`);
  }

  const json = await res.json();
  const rows: RawPostRow[] = json.list_widgets ?? [];

  return rows
    .filter((row) => row.widget_type === "POST_ROW" && row.data?.action?.payload?.token)
    .map((row) => {
      const payload = row.data!.action!.payload!;
      return {
        token: payload.token!,
        title: payload.web_info?.title ?? row.data!.title ?? "",
        price: parsePersianPrice(row.data!.middle_description_text),
        city: payload.web_info?.city_persian ?? null,
        district: payload.web_info?.district_persian ?? null,
        imageUrl: row.data!.image_url ?? null,
      };
    });
}

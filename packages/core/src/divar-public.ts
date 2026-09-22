// Unofficial: Divar's own public "postlist" feed, NOT the documented Kenar API.
// Kenar's finder/post search is capped at 100 calls for the app's entire lifetime
// (see docs/post/search_post.md in divar-ir/kenar-docs), which makes it unusable
// for routine polling - so this hits the same endpoint divar.ir's own site calls.
//
// CAVEAT (read before trusting this blindly): confirmed empirically that this
// endpoint is live and returns real, current listings with usable fields (token,
// title, price, city). NOT confirmed: that the category/city filters below are
// actually respected server-side - several guessed request shapes were silently
// ignored and returned the same general nationwide feed regardless. Until we
// capture one real request from an actual browser session (open divar.ir, search,
// check DevTools Network tab for the request to api.divar.ir), treat this as a
// best-effort firehose and lean on `matchesKeywords` (see keywords.ts) as the
// real filter. If Divar changes this endpoint, only this file needs fixing.
//
// Kept deliberately low-frequency (one household's polling, not a scraping
// service) - see worker/src/divar-discovery.ts for the interval/backoff logic.

const FEED_URL = "https://api.divar.ir/v8/postlist/w/search";

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

export async function fetchDivarFeed(params: {
  category?: string;
  cityIds?: string[];
} = {}): Promise<DivarFeedItem[]> {
  const body: Record<string, unknown> = {};
  if (params.category) {
    body.json_schema = { data: { category: { str: { value: params.category } } } };
  }
  if (params.cityIds?.length) {
    body.cities = params.cityIds;
  }

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
        price: null, // not reliably present on this feed shape; enrich via Kenar getPost
        city: payload.web_info?.city_persian ?? null,
        district: payload.web_info?.district_persian ?? null,
        imageUrl: row.data!.image_url ?? null,
      };
    });
}

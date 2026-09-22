import { prisma } from "./db";

const BASE_URL = "https://open-api.divar.ir";

// Kenar docs put a hard, lifetime (not daily) cap of 100 calls on finder/post,
// even in production. We stop well before that so a bug can never silently
// burn the whole budget - see docs/post/search_post.md in divar-ir/kenar-docs.
const FINDER_POST_LIFETIME_CAP = 100;
const FINDER_POST_SAFETY_MARGIN = 10;

export class KenarError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "KenarError";
  }
}

export class KenarBudgetExceededError extends KenarError {
  constructor(used: number) {
    super(
      `Refusing to call finder/post: ${used}/${FINDER_POST_LIFETIME_CAP} lifetime calls already used ` +
        `(safety margin is ${FINDER_POST_SAFETY_MARGIN}). This endpoint cannot sustain routine polling - ` +
        `see docs/post/search_post.md. Reserve remaining calls for a deliberate manual search.`
    );
  }
}

export interface KenarPost {
  token: string;
  category: string;
  city: string;
  district?: string;
  chat_enabled?: boolean;
  data: {
    title: string;
    description?: string;
    images?: string[];
    price?: { mode: string; value: string | number };
    [key: string]: unknown;
  };
  business_data?: { business_type: string; business_name: string };
}

async function kenarFetch(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new KenarError(`Kenar request failed (${res.status}): ${body}`, res.status);
  }

  return res.json();
}

/** GET finder/post/{token} - no meaningful rate limit, safe to call freely. */
export async function getPost(token: string, apiKey: string): Promise<KenarPost> {
  return kenarFetch(`/v1/open-platform/finder/post/${token}`, apiKey);
}

export interface SearchPostsFilters {
  category: string;
  city?: string;
  districts?: string[];
  query?: Record<string, unknown>;
}

export interface SearchPostItem {
  token: string;
  category: string;
  last_modified_at: string;
  city: string;
  title: string;
  price?: { mode: string; value: string };
}

/**
 * POST v2 finder/post - budget-gated. Do NOT call this from the routine poller;
 * it's reserved for a deliberate, user-triggered "deep search" a handful of times.
 */
export async function searchPosts(
  filters: SearchPostsFilters,
  apiKey: string
): Promise<{ posts: SearchPostItem[] }> {
  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  if (setting.finderCallsUsed >= FINDER_POST_LIFETIME_CAP - FINDER_POST_SAFETY_MARGIN) {
    throw new KenarBudgetExceededError(setting.finderCallsUsed);
  }

  const result = await kenarFetch("/v2/open-platform/finder/post", apiKey, {
    method: "POST",
    body: JSON.stringify(filters),
  });

  await prisma.setting.update({
    where: { id: 1 },
    data: { finderCallsUsed: { increment: 1 } },
  });

  return result;
}

export async function getFinderBudget() {
  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return {
    used: setting.finderCallsUsed,
    cap: FINDER_POST_LIFETIME_CAP,
    remaining: FINDER_POST_LIFETIME_CAP - setting.finderCallsUsed,
  };
}

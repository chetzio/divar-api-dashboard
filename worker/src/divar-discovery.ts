import { prisma, fetchDivarFeed, matchesKeywords, DEFAULT_RADIO_KEYWORDS } from "@radiokar/core";
import type { Candidate } from "@radiokar/core";

const TICK_MS = 60_000; // check once a minute which saved searches are due; each search has its own intervalMinutes

export type NewCandidateHandler = (candidate: Candidate & { savedSearchLabel: string }) => Promise<void> | void;

export function startDiscoveryLoop(onNewCandidate: NewCandidateHandler): NodeJS.Timeout {
  const tick = () => runTick(onNewCandidate).catch((err) => console.error("[discovery] tick failed", err));
  tick();
  return setInterval(tick, TICK_MS);
}

async function runTick(onNewCandidate: NewCandidateHandler) {
  const searches = await prisma.savedSearch.findMany({ where: { active: true } });
  const now = Date.now();

  for (const search of searches) {
    const due =
      !search.lastPolledAt || now - search.lastPolledAt.getTime() >= search.intervalMinutes * 60_000;
    if (due) {
      await pollOne(search, onNewCandidate);
    }
  }
}

async function pollOne(
  search: Awaited<ReturnType<typeof prisma.savedSearch.findMany>>[number],
  onNewCandidate: NewCandidateHandler
) {
  await prisma.savedSearch.update({ where: { id: search.id }, data: { lastPolledAt: new Date() } });

  let feed;
  try {
    // NOTE: cityIds intentionally omitted - SavedSearch.cities stores Divar city
    // *slugs* (e.g. "tehran") but this feed's cities filter expects numeric ids,
    // and it's unconfirmed the filter is even respected server-side (see
    // divar-public.ts). Every saved search currently polls the same nationwide
    // feed and is differentiated only by its own keyword list.
    feed = await fetchDivarFeed({ category: search.category ?? undefined });
  } catch (err) {
    console.error(`[discovery] fetch failed for "${search.label}":`, err);
    return; // quiet backoff, next tick retries
  }

  const extraKeywords = search.queryText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const keywords = [...DEFAULT_RADIO_KEYWORDS, ...extraKeywords];
  const matches = feed.filter((item) => item.title && matchesKeywords(item.title, keywords));

  for (const match of matches) {
    const exists = await prisma.candidate.findUnique({
      where: { savedSearchId_postToken: { savedSearchId: search.id, postToken: match.token } },
    });
    if (exists) continue;

    const candidate = await prisma.candidate.create({
      data: {
        savedSearchId: search.id,
        postToken: match.token,
        title: match.title,
        price: match.price,
        city: match.city,
        photoUrl: match.imageUrl,
      },
    });

    await onNewCandidate({ ...candidate, savedSearchLabel: search.label });
  }
}

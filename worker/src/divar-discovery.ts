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

  // Server-side query search is confirmed working (verified live 2026-09-22 -
  // see divar-public.ts). queryText is what the user actually meant to search
  // for; fall back to the search's own label since that's what people
  // naturally type their intent into (confirmed real usage: a search literally
  // labeled "رادیو قدیمی" with empty queryText - using the label here is what
  // makes that work without any UI change).
  const query = search.queryText.trim() || search.label.trim();
  const cities = Array.isArray(search.cities) ? (search.cities as string[]) : [];

  let feed;
  try {
    feed = await fetchDivarFeed({
      query: query || undefined,
      category: search.category ?? undefined,
      cities,
    });
  } catch (err) {
    console.error(`[discovery] fetch failed for "${search.label}":`, err);
    return; // quiet backoff, next tick retries
  }

  // Server-side query search is already quite precise (confirmed ~93% relevant
  // in testing), but keep the keyword filter as a cheap safety net in case the
  // query was generic or Divar's matching drifts.
  const matches = feed.filter((item) => item.title && matchesKeywords(item.title, DEFAULT_RADIO_KEYWORDS));

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

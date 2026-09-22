import { prisma } from "./db";

export async function promoteCandidateToItem(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return null;

  const [item] = await prisma.$transaction([
    prisma.item.create({
      data: {
        status: "HUNTING",
        title: candidate.title,
        city: candidate.city,
        postToken: candidate.postToken,
        sourceUrl: `https://divar.ir/v/${candidate.postToken}`,
        photos: candidate.photoUrl ? [candidate.photoUrl] : [],
      },
    }),
    prisma.candidate.update({ where: { id: candidateId }, data: { status: "PROMOTED" } }),
  ]);

  return item;
}

export async function dismissCandidateById(candidateId: string) {
  await prisma.candidate.update({ where: { id: candidateId }, data: { status: "DISMISSED" } });
}

"use server";

import { promoteCandidateToItem, dismissCandidateById } from "@radiokar/core";
import { revalidatePath } from "next/cache";

export async function promoteCandidate(id: string) {
  await promoteCandidateToItem(id);
  revalidatePath("/finds");
  revalidatePath("/items");
  revalidatePath("/");
}

export async function dismissCandidate(id: string) {
  await dismissCandidateById(id);
  revalidatePath("/finds");
  revalidatePath("/");
}

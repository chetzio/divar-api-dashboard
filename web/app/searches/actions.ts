"use server";

import { prisma } from "@radiokar/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function cities(formData: FormData): string[] {
  const raw = str(formData, "cities");
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export async function createSavedSearch(formData: FormData) {
  await prisma.savedSearch.create({
    data: {
      label: str(formData, "label") ?? "جستجوی بدون‌نام",
      queryText: str(formData, "queryText") ?? "",
      cities: cities(formData),
      category: str(formData, "category"),
      intervalMinutes: parseInt(str(formData, "intervalMinutes") ?? "20", 10),
      active: true,
    },
  });
  revalidatePath("/searches");
  redirect("/searches");
}

export async function toggleSavedSearch(id: string, active: boolean) {
  await prisma.savedSearch.update({ where: { id }, data: { active } });
  revalidatePath("/searches");
}

export async function deleteSavedSearch(id: string) {
  await prisma.savedSearch.delete({ where: { id } });
  revalidatePath("/searches");
}

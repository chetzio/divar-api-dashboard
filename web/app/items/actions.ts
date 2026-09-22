"use server";

import { prisma } from "@radiokar/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function int(formData: FormData, key: string): number | undefined {
  const v = str(formData, key);
  return v ? parseInt(v.replace(/[^\d]/g, ""), 10) : undefined;
}

function date(formData: FormData, key: string): Date | undefined {
  const v = str(formData, key);
  return v ? new Date(v) : undefined;
}

function photos(formData: FormData): string[] {
  const raw = str(formData, "photos");
  if (!raw) return [];
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function itemDataFromForm(formData: FormData) {
  return {
    status: str(formData, "status") as never,
    title: str(formData, "title") ?? "بدون عنوان",
    brandModel: str(formData, "brandModel"),
    city: str(formData, "city"),
    sourceUrl: str(formData, "sourceUrl"),
    photos: photos(formData),
    purchasePrice: int(formData, "purchasePrice"),
    purchaseDate: date(formData, "purchaseDate"),
    sellerName: str(formData, "sellerName"),
    sellerPhone: str(formData, "sellerPhone"),
    sellerNotes: str(formData, "sellerNotes"),
    sellerContactId: str(formData, "sellerContactId"),
    listedPrice: int(formData, "listedPrice"),
    saleChannel: str(formData, "saleChannel") as never,
    salePrice: int(formData, "salePrice"),
    saleDate: date(formData, "saleDate"),
    notes: str(formData, "notes"),
  };
}

export async function createItem(formData: FormData) {
  const item = await prisma.item.create({ data: itemDataFromForm(formData) });
  revalidatePath("/items");
  revalidatePath("/");
  redirect(`/items/${item.id}`);
}

export async function updateItem(id: string, formData: FormData) {
  await prisma.item.update({ where: { id }, data: itemDataFromForm(formData) });
  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  revalidatePath("/");
}

export async function deleteItem(id: string) {
  await prisma.item.delete({ where: { id } });
  revalidatePath("/items");
  revalidatePath("/");
  redirect("/items");
}

export async function addExpense(itemId: string, formData: FormData) {
  const amount = int(formData, "amount");
  if (!amount) return;
  await prisma.expense.create({
    data: {
      itemId,
      category: (str(formData, "category") ?? "REPAIR") as never,
      description: str(formData, "description"),
      amount,
      date: date(formData, "date") ?? new Date(),
      contactId: str(formData, "contactId"),
    },
  });
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}

export async function deleteExpense(itemId: string, expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/");
}

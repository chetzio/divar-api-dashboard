"use server";

import { prisma } from "@radiokar/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function contactDataFromForm(formData: FormData) {
  return {
    name: str(formData, "name") ?? "بدون‌نام",
    phone: str(formData, "phone"),
    role: (str(formData, "role") ?? "OTHER") as never,
    notes: str(formData, "notes"),
  };
}

export async function createContact(formData: FormData) {
  const contact = await prisma.contact.create({ data: contactDataFromForm(formData) });
  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(id: string, formData: FormData) {
  await prisma.contact.update({ where: { id }, data: contactDataFromForm(formData) });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  redirect("/contacts");
}

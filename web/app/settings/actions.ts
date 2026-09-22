"use server";

import { prisma, sendTestEmail, sendTestSms } from "@radiokar/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

export async function saveKenarApiKey(formData: FormData) {
  const kenarApiKey = String(formData.get("kenarApiKey") ?? "").trim();
  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, kenarApiKey },
    update: { kenarApiKey },
  });
  revalidatePath("/settings");
}

export async function saveEmailSetting(formData: FormData) {
  const notifyEmail = str(formData, "notifyEmail");
  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, notifyEmail },
    update: { notifyEmail: notifyEmail ?? null },
  });
  revalidatePath("/settings");
}

export async function saveSmsSetting(formData: FormData) {
  const notifyPhone = str(formData, "notifyPhone");
  const smsProvider = str(formData, "smsProvider");
  const smsApiKey = str(formData, "smsApiKey");
  await prisma.setting.upsert({
    where: { id: 1 },
    create: { id: 1, notifyPhone, smsProvider, smsApiKey },
    update: {
      notifyPhone: notifyPhone ?? null,
      smsProvider: smsProvider ?? null,
      smsApiKey: smsApiKey ?? null,
    },
  });
  revalidatePath("/settings");
}

export async function sendTestEmailAction() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  let result = "ok";
  if (!setting?.notifyEmail) {
    result = `error:${encodeURIComponent("اول یک ایمیل ذخیره کن")}`;
  } else {
    try {
      await sendTestEmail(setting.notifyEmail);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای نامشخص";
      result = `error:${encodeURIComponent(message)}`;
    }
  }
  redirect(`/settings?emailTest=${result}`);
}

export async function sendTestSmsAction() {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  let result = "ok";
  if (!setting?.notifyPhone || !setting?.smsProvider || !setting?.smsApiKey) {
    result = `error:${encodeURIComponent("اول شماره، ارائه‌دهنده و کلید API رو ذخیره کن")}`;
  } else {
    try {
      await sendTestSms(setting.notifyPhone, setting.smsProvider, setting.smsApiKey);
    } catch (err) {
      const message = err instanceof Error ? err.message : "خطای نامشخص";
      result = `error:${encodeURIComponent(message)}`;
    }
  }
  redirect(`/settings?smsTest=${result}`);
}

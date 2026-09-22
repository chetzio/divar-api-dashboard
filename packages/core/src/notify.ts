import nodemailer from "nodemailer";
import { prisma } from "./db";
import { formatToman } from "./format";
import type { Candidate } from "../generated/prisma/index.js";

type NotifiableCandidate = Candidate & { savedSearchLabel: string };

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

/**
 * SMTP connection details live in env vars (infra credentials), not the DB -
 * same reasoning as DATABASE_URL. The *destination* address (dad's inbox) is
 * a Setting field, editable from /settings.
 */
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(SMTP_PORT ?? 465);
  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

function candidateEmailBody(candidate: NotifiableCandidate) {
  const price = candidate.price ? formatToman(candidate.price) : "—";
  return (
    `یافته‌ی تازه از جستجوی «${candidate.savedSearchLabel}»\n\n` +
    `${candidate.title}\n` +
    `شهر: ${candidate.city ?? "—"}\n` +
    `قیمت: ${price}\n\n` +
    `مشاهده در دیوار: https://divar.ir/v/${candidate.postToken}`
  );
}

/** Never throws - a failed/unconfigured email must not take down the discovery poller. */
export async function sendEmailNotification(candidate: NotifiableCandidate): Promise<void> {
  try {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!setting?.notifyEmail) {
      console.warn("[notify] no notifyEmail set yet - skipping, set it on the settings page");
      return;
    }
    const transporter = getTransporter();
    if (!transporter) {
      console.warn("[notify] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS in worker/.env) - skipping email");
      return;
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: setting.notifyEmail,
      subject: `رادیوکار: یافته تازه - ${candidate.title}`,
      text: candidateEmailBody(candidate),
    });
  } catch (err) {
    console.error("[notify] failed to send email notification", err);
  }
}

/** Used by the settings page's "send test email" button - throws on failure so the UI can report it. */
export async function sendTestEmail(to: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP تنظیم نشده (SMTP_HOST/SMTP_USER/SMTP_PASS در worker/.env)");
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "رادیوکار - پیام آزمایشی",
    text: "این یک پیام آزمایشی از رادیوکار است. اگر این را می‌بینی، اطلاع‌رسانی ایمیل درست کار می‌کند ✅",
  });
}

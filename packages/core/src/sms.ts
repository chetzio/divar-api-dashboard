import { prisma } from "./db";
import { formatToman } from "./format";
import type { Candidate } from "../generated/prisma/index.js";

type NotifiableCandidate = Candidate & { savedSearchLabel: string };
type SmsSender = (phone: string, message: string, apiKey: string) => Promise<void>;

/**
 * One small adapter per Iranian SMS gateway, keyed by Setting.smsProvider.
 * Kavenegar is implemented first (simplest REST API); adding Melipayamak /
 * SMS.ir / Ghasedak later is one more entry here, not a rewrite of callers.
 */
async function sendViaKavenegar(phone: string, message: string, apiKey: string): Promise<void> {
  const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`);
  url.searchParams.set("receptor", phone);
  url.searchParams.set("message", message);

  const res = await fetch(url.toString());
  const body: unknown = await res.json().catch(() => null);
  const status = (body as { return?: { status?: number } } | null)?.return?.status;
  if (!res.ok || status !== 200) {
    throw new Error(`Kavenegar send failed: HTTP ${res.status}, body ${JSON.stringify(body)}`);
  }
}

const PROVIDERS: Record<string, SmsSender> = {
  kavenegar: sendViaKavenegar,
};

export const SMS_PROVIDERS = Object.keys(PROVIDERS);

function candidateSmsText(candidate: NotifiableCandidate): string {
  const price = candidate.price ? formatToman(candidate.price) : "";
  const text = `رادیوکار: یافته تازه - ${candidate.title}${price ? " - " + price : ""} - divar.ir/v/${candidate.postToken}`;
  return text.slice(0, 300);
}

/** Never throws - a failed/unconfigured SMS must not take down the discovery poller. */
export async function sendSmsNotification(candidate: NotifiableCandidate): Promise<void> {
  try {
    const setting = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!setting?.notifyPhone || !setting?.smsProvider || !setting?.smsApiKey) {
      console.warn("[notify] SMS not configured yet (phone/provider/API key) - skipping, set it on the settings page");
      return;
    }
    const send = PROVIDERS[setting.smsProvider];
    if (!send) {
      console.warn(`[notify] unknown SMS provider "${setting.smsProvider}" - skipping`);
      return;
    }
    await send(setting.notifyPhone, candidateSmsText(candidate), setting.smsApiKey);
  } catch (err) {
    console.error("[notify] failed to send SMS notification", err);
  }
}

/** Used by the settings page's "send test SMS" button - throws on failure so the UI can report it. */
export async function sendTestSms(phone: string, provider: string, apiKey: string): Promise<void> {
  const send = PROVIDERS[provider];
  if (!send) throw new Error(`ارائه‌دهنده «${provider}» هنوز پشتیبانی نمی‌شود`);
  await send(phone, "این یک پیام آزمایشی از رادیوکار است. اگر این را می‌بینی، پیامک درست کار می‌کند.", apiKey);
}

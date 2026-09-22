import "dotenv/config";
import { startDiscoveryLoop } from "./divar-discovery";
import { sendEmailNotification, sendSmsNotification } from "@radiokar/core";
import type { Candidate } from "@radiokar/core";

type NotifiableCandidate = Candidate & { savedSearchLabel: string };

// Telegram is a Phase 2 feature. It only starts if TELEGRAM_BOT_TOKEN is set
// in worker/.env - Phase 1 runs fine with zero Telegram config, candidates
// get pushed by email/SMS instead. Setting the token later (no code change
// needed) is all it takes to light this back up - bot.ts itself is untouched.
let telegramNotify: ((candidate: NotifiableCandidate) => Promise<void>) | null = null;

async function maybeStartTelegram() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[worker] TELEGRAM_BOT_TOKEN not set - Telegram bot disabled for now (email/SMS still active)");
    return;
  }

  const { createBot, notifyNewCandidate } = await import("./bot");
  const bot = createBot(token);
  telegramNotify = (candidate) => notifyNewCandidate(bot, candidate);

  bot.launch().then(
    () => console.log("[worker] Telegram bot connected"),
    (err) => {
      // Don't let a Telegram outage take down anything else - email/SMS keep working.
      console.error("[worker] Telegram bot failed to start, continuing without it:", err.message);
      telegramNotify = null;
    }
  );

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

async function notifyAllChannels(candidate: NotifiableCandidate) {
  // sendEmailNotification/sendSmsNotification already catch their own errors
  // and never throw (see packages/core/src/notify.ts, sms.ts) - one channel
  // being unconfigured or failing can't block another or crash the poller.
  await Promise.all([
    sendEmailNotification(candidate),
    sendSmsNotification(candidate),
    telegramNotify ? telegramNotify(candidate) : Promise.resolve(),
  ]);
}

maybeStartTelegram();
startDiscoveryLoop(notifyAllChannels);
console.log("[worker] Divar discovery poller running (email + SMS notifications)");

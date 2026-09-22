import { Telegraf, Markup } from "telegraf";
import {
  prisma,
  getPost,
  promoteCandidateToItem,
  dismissCandidateById,
  getLedgerStats,
  formatToman,
  type Candidate,
} from "@radiokar/core";

function extractDivarToken(text: string): string | null {
  try {
    const url = new URL(text.trim());
    if (!url.hostname.includes("divar.ir")) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.at(-1) ?? null;
  } catch {
    return null;
  }
}

async function getKenarApiKey(): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return setting?.kenarApiKey ?? null;
}

export function createBot(token: string) {
  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await prisma.setting.upsert({
      where: { id: 1 },
      create: { id: 1, telegramChatId: String(ctx.chat.id) },
      update: { telegramChatId: String(ctx.chat.id) },
    });
    await ctx.reply(
      "سلام! رادیوکار وصل شد 📻\n\n" +
        "- لینک یه آگهی دیوار رو بفرست تا خلاصه‌اش رو نشونت بدم.\n" +
        "- برای ثبت سریع خرید بنویس: خرید | عنوان | قیمت\n" +
        "- دستور /stats خلاصه وضعیت کار رو نشون می‌ده."
    );
  });

  bot.command("stats", async (ctx) => {
    const { totalSpent, totalEarned, realizedProfit, inventoryCount, inventoryCost } =
      await getLedgerStats();
    await ctx.reply(
      `📊 خلاصه رادیوکار\n\n` +
        `کل خرج‌شده: ${formatToman(totalSpent)}\n` +
        `کل فروخته‌شده: ${formatToman(totalEarned)}\n` +
        `سود قطعی‌شده: ${formatToman(realizedProfit)}\n` +
        `موجودی انبار: ${inventoryCount.toLocaleString("fa-IR")} عدد (${formatToman(inventoryCost)})`
    );
  });

  bot.on("text", async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith("/")) return;

    const token = extractDivarToken(text);
    if (token) {
      const apiKey = await getKenarApiKey();
      if (!apiKey) {
        await ctx.reply("اول باید کلید API کنار رو توی صفحه تنظیمات وب‌اپ ذخیره کنی.");
        return;
      }
      try {
        const post = await getPost(token, apiKey);
        const price = post.data.price ? formatToman(Number(post.data.price.value)) : "—";
        const caption = `${post.data.title}\n💰 ${price}\n📍 ${post.city}`;
        const image = post.data.images?.[0];
        const keyboard = Markup.inlineKeyboard([
          Markup.button.callback("➕ افزودن به لیست", `quickadd:${token}`),
        ]);
        if (image) {
          await ctx.replyWithPhoto(image, { caption, ...keyboard });
        } else {
          await ctx.reply(caption, keyboard);
        }
      } catch (err) {
        console.error("[bot] getPost failed", err);
        await ctx.reply("نتونستم اطلاعات این آگهی رو از دیوار بگیرم.");
      }
      return;
    }

    if (text.startsWith("خرید")) {
      const parts = text.split("|").map((p) => p.trim());
      if (parts.length >= 3) {
        const title = parts[1];
        const price = parseInt(parts[2].replace(/[^\d]/g, ""), 10);
        const item = await prisma.item.create({
          data: {
            status: "PURCHASED",
            title,
            purchasePrice: Number.isFinite(price) ? price : undefined,
            purchaseDate: new Date(),
          },
        });
        await ctx.reply(`ثبت شد ✅\n${item.title} - ${formatToman(item.purchasePrice)}`);
      } else {
        await ctx.reply("فرمت درست: خرید | عنوان | قیمت");
      }
      return;
    }

    await ctx.reply(
      "متوجه نشدم. یه لینک آگهی دیوار بفرست، یا برای ثبت خرید بنویس: خرید | عنوان | قیمت"
    );
  });

  bot.action(/^quickadd:(.+)$/, async (ctx) => {
    const token = ctx.match[1];
    const apiKey = await getKenarApiKey();
    if (!apiKey) {
      await ctx.answerCbQuery("کلید API کنار تنظیم نشده.");
      return;
    }
    try {
      const post = await getPost(token, apiKey);
      await prisma.item.create({
        data: {
          status: "HUNTING",
          title: post.data.title,
          city: post.city,
          postToken: token,
          sourceUrl: `https://divar.ir/v/${token}`,
          photos: post.data.images ?? [],
        },
      });
      await ctx.answerCbQuery("افزوده شد ✅");
      await ctx.editMessageReplyMarkup(undefined);
    } catch (err) {
      console.error("[bot] quickadd failed", err);
      await ctx.answerCbQuery("مشکلی پیش اومد.");
    }
  });

  bot.action(/^promote:(.+)$/, async (ctx) => {
    await promoteCandidateToItem(ctx.match[1]);
    await ctx.answerCbQuery("افزوده شد ✅");
    await ctx.editMessageReplyMarkup(undefined);
  });

  bot.action(/^dismiss:(.+)$/, async (ctx) => {
    await dismissCandidateById(ctx.match[1]);
    await ctx.answerCbQuery("رد شد");
    await ctx.editMessageReplyMarkup(undefined);
  });

  return bot;
}

export async function notifyNewCandidate(
  bot: ReturnType<typeof createBot>,
  candidate: Candidate & { savedSearchLabel: string }
) {
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!setting?.telegramChatId) {
    console.warn("[bot] no telegramChatId set yet - skipping notification, run /start in Telegram first");
    return;
  }

  const caption =
    `🔔 یافته‌ی تازه از «${candidate.savedSearchLabel}»\n\n` +
    `${candidate.title}\n` +
    `📍 ${candidate.city ?? "—"}${candidate.price ? ` · ${formatToman(candidate.price)}` : ""}`;

  const keyboard = Markup.inlineKeyboard([
    Markup.button.callback("➕ افزودن به لیست", `promote:${candidate.id}`),
    Markup.button.callback("رد کردن", `dismiss:${candidate.id}`),
  ]);

  try {
    if (candidate.photoUrl) {
      await bot.telegram.sendPhoto(setting.telegramChatId, candidate.photoUrl, {
        caption,
        ...keyboard,
      });
    } else {
      await bot.telegram.sendMessage(setting.telegramChatId, caption, keyboard);
    }
  } catch (err) {
    console.error("[bot] failed to push candidate notification", err);
  }
}

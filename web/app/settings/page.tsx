import { prisma, getFinderBudget, SMS_PROVIDERS } from "@radiokar/core";
import {
  saveKenarApiKey,
  saveEmailSetting,
  saveSmsSetting,
  sendTestEmailAction,
  sendTestSmsAction,
} from "./actions";

const PROVIDER_LABELS: Record<string, string> = {
  kavenegar: "کاوه‌نگار",
};

function TestResultBanner({ value }: { value?: string }) {
  if (!value) return null;
  if (value === "ok") {
    return <p className="text-sm text-success">پیام آزمایشی با موفقیت ارسال شد ✅</p>;
  }
  const message = value.startsWith("error:") ? decodeURIComponent(value.slice(6)) : "خطا در ارسال";
  return <p className="text-sm text-danger">ارسال نشد: {message}</p>;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ emailTest?: string; smsTest?: string }>;
}) {
  const { emailTest, smsTest } = await searchParams;
  const setting = await prisma.setting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  const budget = await getFinderBudget();

  return (
    <div className="space-y-6">
      <h1 className="heading">تنظیمات</h1>

      <section className="card space-y-3">
        <h2 className="section-heading">اطلاع‌رسانی ایمیلی</h2>
        <p className="text-xs text-subtle">
          هر وقت یافته‌ی تازه‌ای پیدا بشه، یک ایمیل به این آدرس فرستاده می‌شه.
        </p>
        <form action={saveEmailSetting} className="flex gap-2">
          <input
            name="notifyEmail"
            type="email"
            defaultValue={setting.notifyEmail ?? ""}
            className="input"
            dir="ltr"
            placeholder="dad@example.com"
          />
          <button type="submit" className="shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-canvas">
            ذخیره
          </button>
        </form>
        <form action={sendTestEmailAction}>
          <button type="submit" className="btn-secondary">
            ارسال پیام آزمایشی
          </button>
        </form>
        <TestResultBanner value={emailTest} />
      </section>

      <section className="card space-y-3">
        <h2 className="section-heading">اطلاع‌رسانی پیامکی</h2>
        <p className="text-xs text-subtle">
          نیاز به یک حساب نزد یکی از سرویس‌دهنده‌های پیامک ایرانی داره (مثلاً کاوه‌نگار) — خودت باید ثبت‌نام کنی و کلید API رو بگیری، اینجا فقط ذخیره‌اش می‌کنیم.
        </p>
        <form action={saveSmsSetting} className="space-y-2">
          <input
            name="notifyPhone"
            defaultValue={setting.notifyPhone ?? ""}
            className="input"
            dir="ltr"
            placeholder="09xxxxxxxxx"
          />
          <select name="smsProvider" defaultValue={setting.smsProvider ?? SMS_PROVIDERS[0]} className="input">
            {SMS_PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p] ?? p}
              </option>
            ))}
          </select>
          <input
            name="smsApiKey"
            defaultValue={setting.smsApiKey ?? ""}
            className="input"
            dir="ltr"
            placeholder="SMS API Key"
          />
          <button type="submit" className="w-full rounded-md bg-primary py-2 text-sm font-bold text-canvas">
            ذخیره
          </button>
        </form>
        <form action={sendTestSmsAction}>
          <button type="submit" className="btn-secondary">
            ارسال پیامک آزمایشی
          </button>
        </form>
        <TestResultBanner value={smsTest} />
      </section>

      <section className="card space-y-2">
        <h2 className="section-heading">تلگرام (فاز دوم)</h2>
        {setting.telegramChatId ? (
          <p className="text-sm text-success">ربات تلگرام وصل شده ✅</p>
        ) : (
          <p className="text-sm text-subtle">
            هنوز راه‌اندازی نشده. این قابلیت برای فاز بعدی پروژه کنار گذاشته شده.
          </p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="section-heading">کلید API کنار دیوار</h2>
        <p className="text-xs text-subtle">از پنل kenar.divar.dev بگیر و اینجا بچسبون.</p>
        <form action={saveKenarApiKey} className="flex gap-2">
          <input
            name="kenarApiKey"
            defaultValue={setting.kenarApiKey ?? ""}
            className="input"
            dir="ltr"
            placeholder="Kenar API Key"
          />
          <button type="submit" className="shrink-0 rounded-md bg-primary px-4 text-sm font-bold text-canvas">
            ذخیره
          </button>
        </form>
      </section>

      <section className="card space-y-1">
        <h2 className="section-heading">سهمیه جستجوی رسمی کنار</h2>
        <p className="text-sm text-ink">
          {budget.used.toLocaleString("fa-IR")} از {budget.cap.toLocaleString("fa-IR")} بار مصرف شده
        </p>
        <p className="text-xs text-muted">
          این API فقط در کل عمر برنامه ۱۰۰ بار قابل استفاده‌ست، برای همین فقط برای جستجوی دستی و گاه‌به‌گاه نگه داشته شده، نه چک خودکار.
        </p>
      </section>
    </div>
  );
}

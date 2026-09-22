const tomanFormatter = new Intl.NumberFormat("fa-IR");

export function formatToman(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${tomanFormatter.format(value)} تومان`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
}

export const STATUS_LABELS: Record<string, string> = {
  HUNTING: "در جستجو",
  NEGOTIATING: "در حال چانه‌زنی",
  PURCHASED: "خریداری‌شده",
  KEEPING: "نگه‌داری برای خودم",
  LISTED: "برای فروش گذاشته‌شده",
  SOLD: "فروخته‌شده",
};

export const SALE_CHANNEL_LABELS: Record<string, string> = {
  DIVAR: "دیوار",
  INSTAGRAM: "اینستاگرام",
  OTHER: "سایر",
};

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  SELLER: "فروشنده",
  REPAIR: "تعمیرکار",
  BUYER: "خریدار",
  OTHER: "سایر",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  REPAIR: "تعمیر",
  PARTS: "قطعات",
  SHIPPING: "حمل‌ونقل",
  OTHER: "سایر",
};

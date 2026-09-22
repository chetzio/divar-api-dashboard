import { prisma } from "@radiokar/core";
import { STATUS_LABELS, SALE_CHANNEL_LABELS } from "@/lib/format";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function dateOnly(d: Date | null | undefined): string {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export async function GET() {
  const items = await prisma.item.findMany({
    orderBy: { createdAt: "asc" },
    include: { expenses: true },
  });

  const header = [
    "عنوان",
    "وضعیت",
    "برند/مدل",
    "شهر",
    "قیمت خرید",
    "تاریخ خرید",
    "نام فروشنده",
    "شماره فروشنده",
    "جمع هزینه‌ها",
    "قیمت درخواستی",
    "کانال فروش",
    "قیمت فروش",
    "تاریخ فروش",
    "سود",
  ];

  const rows = items.map((item) => {
    const expensesTotal = item.expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = item.status === "SOLD" ? (item.salePrice ?? 0) - (item.purchasePrice ?? 0) - expensesTotal : "";

    return [
      item.title,
      STATUS_LABELS[item.status] ?? item.status,
      item.brandModel ?? "",
      item.city ?? "",
      item.purchasePrice ?? "",
      dateOnly(item.purchaseDate),
      item.sellerName ?? "",
      item.sellerPhone ?? "",
      expensesTotal,
      item.listedPrice ?? "",
      item.saleChannel ? (SALE_CHANNEL_LABELS[item.saleChannel] ?? item.saleChannel) : "",
      item.salePrice ?? "",
      dateOnly(item.saleDate),
      profit,
    ]
      .map(csvEscape)
      .join(",");
  });

  // Leading BOM so Excel on Windows detects UTF-8 and renders Persian text correctly
  // instead of mojibake - this matters a lot more than it looks for an RTL export.
  const BOM = String.fromCharCode(0xfeff);
  const csv = BOM + [header.map(csvEscape).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="radiokar-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

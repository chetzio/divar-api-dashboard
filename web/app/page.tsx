import Link from "next/link";
import { prisma, getLedgerStats, getMonthlyProfit } from "@radiokar/core";
import { formatToman } from "@/lib/format";

export default async function DashboardPage() {
  const [
    { totalSpent, totalEarned, realizedProfit, inventoryCount, inventoryCost, totalExpenses },
    recentCandidates,
    monthlyProfit,
  ] = await Promise.all([
    getLedgerStats(),
    prisma.candidate.findMany({
      where: { status: "NEW" },
      orderBy: { foundAt: "desc" },
      take: 5,
    }),
    getMonthlyProfit(6),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="heading">داشبورد رادیوکار</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="کل خرج‌شده" value={formatToman(totalSpent)} />
        <StatCard label="کل فروخته‌شده" value={formatToman(totalEarned)} />
        <StatCard
          label="سود قطعی‌شده"
          value={formatToman(realizedProfit)}
          highlight={realizedProfit >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="موجودی انبار"
          value={`${inventoryCount.toLocaleString("fa-IR")} عدد`}
          sub={formatToman(inventoryCost)}
        />
        <div className="col-span-2">
          <StatCard label="هزینه تعمیر و قطعات" value={formatToman(totalExpenses)} />
        </div>
      </div>

      <Link href="/collection" className="card flex items-center justify-between">
        <span className="section-heading">📻 ویترین مجموعه شخصی</span>
        <span className="text-sm text-primary">مشاهده ←</span>
      </Link>

      <section className="space-y-2">
        <h2 className="section-heading">روند سود ماهانه</h2>
        <MonthlyProfitChart data={monthlyProfit} />
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-heading">یافته‌های تازه</h2>
          <Link href="/finds" className="text-sm text-primary underline">
            همه
          </Link>
        </div>
        {recentCandidates.length === 0 ? (
          <p className="card text-center text-sm text-subtle">فعلاً یافته‌ی تازه‌ای نیست.</p>
        ) : (
          <ul className="space-y-2">
            {recentCandidates.map((c) => (
              <li key={c.id} className="card text-sm">
                <div className="font-semibold">{c.title}</div>
                <div className="text-subtle">{c.city ?? "—"}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/items/new" className="btn-primary">
        + افزودن آیتم جدید
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "success" | "danger";
}) {
  const color =
    highlight === "success" ? "text-success" : highlight === "danger" ? "text-danger" : "text-ink";
  return (
    <div className="card">
      <div className="text-xs text-subtle">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

function MonthlyProfitChart({ data }: { data: { label: string; profit: number }[] }) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.profit)));
  const hasAnyData = data.some((d) => d.profit !== 0);

  return (
    <div className="card">
      {hasAnyData ? (
        <>
          <div className="mb-3 flex items-end justify-between gap-2" style={{ height: 96 }}>
            {data.map((d, i) => {
              const heightPct = Math.max(4, (Math.abs(d.profit) / maxAbs) * 100);
              return (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className={`w-full rounded-sm ${d.profit >= 0 ? "bg-success" : "bg-danger"}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between gap-2 text-[10px] text-subtle">
            {data.map((d, i) => (
              <span key={i} className="flex-1 text-center">
                {d.label}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-center text-sm text-subtle">هنوز فروشی برای نمایش روند سود ثبت نشده.</p>
      )}
    </div>
  );
}

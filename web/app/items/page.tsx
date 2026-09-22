import Link from "next/link";
import { prisma } from "@radiokar/core";
import { formatToman, STATUS_LABELS } from "@/lib/format";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const items = await prisma.item.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="heading">اجناس</h1>
        <div className="flex items-center gap-3">
          <a href="/api/export/items" className="text-xs text-primary underline">
            خروجی اکسل
          </a>
          <Link href="/items/new" className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-canvas">
            + جدید
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <FilterChip href="/items" label="همه" active={!status} />
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <FilterChip key={value} href={`/items?status=${value}`} label={label} active={status === value} />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="card text-center text-sm text-subtle">چیزی اینجا نیست.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/items/${item.id}`} className="card block active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{item.title}</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] text-secondary">
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-subtle">
                  <span>{[item.brandModel, item.city].filter(Boolean).join(" · ") || "—"}</span>
                  <span>{formatToman(item.purchasePrice)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={active ? "chip-active" : "chip bg-surface border border-muted/30"}>
      {label}
    </Link>
  );
}

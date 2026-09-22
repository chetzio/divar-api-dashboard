import Link from "next/link";
import { prisma } from "@radiokar/core";

export default async function CollectionPage() {
  const items = await prisma.item.findMany({
    where: { status: "KEEPING" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="heading">ویترین مجموعه</h1>
      <p className="text-sm text-subtle">رادیوهایی که برای خودت نگه داشتی، نه برای فروش.</p>

      {items.length === 0 ? (
        <p className="card text-center text-sm text-subtle">
          هنوز چیزی توی مجموعه‌ی شخصی‌ت نیست — یک آیتم رو با وضعیت «نگه‌داری برای خودم» علامت بزن تا اینجا نشون داده بشه.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const photos = Array.isArray(item.photos) ? (item.photos as string[]) : [];
            const photo = photos[0];
            return (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="overflow-hidden rounded-lg border border-muted/30 bg-surface active:scale-[0.98]"
              >
                <div className="aspect-square w-full bg-secondary/5">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">📻</div>
                  )}
                </div>
                <div className="p-2">
                  <div className="truncate text-sm font-semibold">{item.title}</div>
                  <div className="truncate text-xs text-subtle">{item.brandModel || "—"}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

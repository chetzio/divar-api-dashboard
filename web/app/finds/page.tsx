import { prisma } from "@radiokar/core";
import { formatToman, formatDate } from "@/lib/format";
import { promoteCandidate, dismissCandidate } from "./actions";

export default async function FindsPage() {
  const candidates = await prisma.candidate.findMany({
    where: { status: "NEW" },
    orderBy: { foundAt: "desc" },
    include: { savedSearch: { select: { label: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="heading">یافته‌های تازه</h1>
      <p className="text-sm text-subtle">
        این‌ها آگهی‌هایی هستند که ربات از جستجوهای ذخیره‌شده پیدا کرده. هرکدام رو بررسی کن و به لیست اجناس اضافه کن یا رد کن.
      </p>

      {candidates.length === 0 ? (
        <p className="card text-center text-sm text-subtle">فعلاً یافته‌ی تازه‌ای نیست.</p>
      ) : (
        <ul className="space-y-3">
          {candidates.map((c) => (
            <li key={c.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs text-subtle">
                    {[c.city, formatToman(c.price)].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-[11px] text-muted">
                    از جستجوی «{c.savedSearch.label}» · {formatDate(c.foundAt)}
                  </div>
                </div>
                {c.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
                )}
              </div>
              <a
                href={`https://divar.ir/v/${c.postToken}`}
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-primary underline"
              >
                مشاهده در دیوار
              </a>
              <div className="flex gap-2">
                <form action={promoteCandidate.bind(null, c.id)} className="flex-1">
                  <button className="w-full rounded-md bg-primary py-2 text-sm font-bold text-canvas">
                    افزودن به لیست
                  </button>
                </form>
                <form action={dismissCandidate.bind(null, c.id)} className="flex-1">
                  <button className="w-full rounded-md border border-muted/50 py-2 text-sm text-subtle">
                    رد کردن
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { prisma } from "@radiokar/core";
import { createSavedSearch, toggleSavedSearch, deleteSavedSearch } from "./actions";

export default async function SearchesPage() {
  const searches = await prisma.savedSearch.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="heading">جستجوهای ذخیره‌شده</h1>
      <p className="text-sm text-subtle">
        ربات هر چند دقیقه یک‌بار دیوار رو برای این جستجوها چک می‌کنه و یافته‌های تازه رو توی صفحه «یافته‌ها» نشون می‌ده.
      </p>

      <ul className="space-y-2">
        {searches.map((s) => (
          <li key={s.id} className="card text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{s.label}</span>
              <span className={s.active ? "text-success" : "text-muted"}>
                {s.active ? "فعال" : "متوقف"}
              </span>
            </div>
            <div className="mt-1 text-xs text-subtle">
              کلیدواژه: {s.queryText || "—"} · شهرها: {(s.cities as string[]).join("، ") || "همه"} · هر{" "}
              {s.intervalMinutes} دقیقه
            </div>
            <div className="mt-2 flex gap-2">
              <form action={toggleSavedSearch.bind(null, s.id, !s.active)}>
                <button className="rounded-md border border-muted/50 px-3 py-1 text-xs">
                  {s.active ? "متوقف کن" : "فعال کن"}
                </button>
              </form>
              <form action={deleteSavedSearch.bind(null, s.id)}>
                <button className="rounded-md border border-danger/40 px-3 py-1 text-xs text-danger">حذف</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <form action={createSavedSearch} className="card space-y-3">
        <h2 className="section-heading">جستجوی جدید</h2>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">عنوان</span>
          <input name="label" required className="input" placeholder="مثلاً رادیوهای قدیمی" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">کلیدواژه‌های اضافه (اختیاری، با کاما جدا کن)</span>
          <input name="queryText" className="input" placeholder="گراموفون, پیک آپ" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">شهرها (اختیاری، خالی = همه ایران)</span>
          <input name="cities" className="input" placeholder="tehran, mashhad" dir="ltr" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">هر چند دقیقه چک بشه</span>
          <input name="intervalMinutes" type="number" defaultValue={20} min={15} className="input" />
        </label>
        <button type="submit" className="btn-primary">
          ذخیره جستجو
        </button>
      </form>
    </div>
  );
}

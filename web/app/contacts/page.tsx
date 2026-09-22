import Link from "next/link";
import { prisma } from "@radiokar/core";
import { CONTACT_ROLE_LABELS } from "@/lib/format";
import { createContact } from "./actions";

export default async function ContactsPage() {
  const contacts = await prisma.contact.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="heading">مخاطبین</h1>
      <p className="text-sm text-subtle">
        فروشنده‌ها و تعمیرکارهایی که باهاشون کار می‌کنی — یک‌بار ثبتشون کن، بعد از هر خرید یا تعمیر فقط انتخابشون کن.
      </p>

      {contacts.length === 0 ? (
        <p className="card text-center text-sm text-subtle">هنوز مخاطبی ثبت نشده.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link href={`/contacts/${c.id}`} className="card block active:scale-[0.99]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[11px] text-secondary">
                    {CONTACT_ROLE_LABELS[c.role]}
                  </span>
                </div>
                {c.phone && (
                  <div className="mt-1 text-xs text-subtle" dir="ltr">
                    {c.phone}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form action={createContact} className="card space-y-3">
        <h2 className="section-heading">مخاطب جدید</h2>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">نام</span>
          <input name="name" required className="input" placeholder="مثلاً استاد رضایی" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">شماره تماس</span>
          <input name="phone" className="input" dir="ltr" placeholder="09xxxxxxxxx" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">نقش</span>
          <select name="role" defaultValue="OTHER" className="input">
            {Object.entries(CONTACT_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">یادداشت</span>
          <textarea name="notes" rows={2} className="input" placeholder="مثلاً تعمیرکار لامپ، محله بازار" />
        </label>
        <button type="submit" className="btn-primary">
          ذخیره مخاطب
        </button>
      </form>
    </div>
  );
}

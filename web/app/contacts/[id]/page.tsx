import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@radiokar/core";
import { CONTACT_ROLE_LABELS, EXPENSE_CATEGORY_LABELS, formatToman, formatDate, STATUS_LABELS } from "@/lib/format";
import { updateContact, deleteContact } from "../actions";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contact, soldOrLinkedItems, expenses] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    prisma.item.findMany({ where: { sellerContactId: id }, orderBy: { updatedAt: "desc" } }),
    prisma.expense.findMany({
      where: { contactId: id },
      orderBy: { date: "desc" },
      include: { item: { select: { id: true, title: true } } },
    }),
  ]);
  if (!contact) notFound();

  const boundUpdate = updateContact.bind(null, id);
  const boundDelete = deleteContact.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="heading">{contact.name}</h1>

      <form action={boundUpdate} className="card space-y-3">
        <label className="block space-y-1">
          <span className="text-sm text-subtle">نام</span>
          <input name="name" defaultValue={contact.name} required className="input" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">شماره تماس</span>
          <input name="phone" defaultValue={contact.phone ?? ""} className="input" dir="ltr" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">نقش</span>
          <select name="role" defaultValue={contact.role} className="input">
            {Object.entries(CONTACT_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-subtle">یادداشت</span>
          <textarea name="notes" defaultValue={contact.notes ?? ""} rows={2} className="input" />
        </label>
        <button type="submit" className="btn-primary">
          ذخیره تغییرات
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="section-heading">اجناسی که از این مخاطب خریداری شده</h2>
        {soldOrLinkedItems.length === 0 ? (
          <p className="card text-center text-sm text-subtle">هنوز آیتمی به این مخاطب وصل نشده.</p>
        ) : (
          <ul className="space-y-2">
            {soldOrLinkedItems.map((item) => (
              <li key={item.id}>
                <Link href={`/items/${item.id}`} className="card block active:scale-[0.99]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-[11px] text-secondary">{STATUS_LABELS[item.status]}</span>
                  </div>
                  <div className="mt-1 text-xs text-subtle">{formatToman(item.purchasePrice)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="section-heading">هزینه‌هایی که این مخاطب انجام داده</h2>
        {expenses.length === 0 ? (
          <p className="card text-center text-sm text-subtle">هنوز هزینه‌ای ثبت نشده.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id}>
                <Link href={`/items/${e.item.id}`} className="card block active:scale-[0.99]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{e.description || EXPENSE_CATEGORY_LABELS[e.category]}</span>
                    <span className="text-sm">{formatToman(e.amount)}</span>
                  </div>
                  <div className="mt-1 text-xs text-subtle">
                    برای «{e.item.title}» · {formatDate(e.date)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={boundDelete}>
        <button type="submit" className="btn-danger-outline">
          حذف این مخاطب
        </button>
      </form>
    </div>
  );
}

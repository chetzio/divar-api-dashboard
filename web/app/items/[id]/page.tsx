import { notFound } from "next/navigation";
import { prisma } from "@radiokar/core";
import ItemForm from "@/components/ItemForm";
import { EXPENSE_CATEGORY_LABELS, formatToman, formatDate } from "@/lib/format";
import { updateItem, deleteItem, addExpense, deleteExpense } from "../actions";

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, contacts, expenses] = await Promise.all([
    prisma.item.findUnique({ where: { id } }),
    prisma.contact.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, role: true } }),
    prisma.expense.findMany({
      where: { itemId: id },
      orderBy: { date: "desc" },
      include: { contact: { select: { name: true } } },
    }),
  ]);
  if (!item) notFound();

  const boundUpdate = updateItem.bind(null, id);
  const boundDelete = deleteItem.bind(null, id);
  const boundAddExpense = addExpense.bind(null, id);
  const boundDeleteExpense = deleteExpense.bind(null, id);
  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const repairContacts = contacts.filter((c) => c.role === "REPAIR" || c.role === "OTHER");

  return (
    <div className="space-y-6">
      <h1 className="heading">ویرایش آیتم</h1>
      <ItemForm action={boundUpdate} defaults={item} submitLabel="ذخیره تغییرات" contacts={contacts} />

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="section-heading">هزینه‌ها (تعمیر، قطعات، ...)</h2>
          {expensesTotal > 0 && <span className="text-sm text-subtle">جمع: {formatToman(expensesTotal)}</span>}
        </div>

        {expenses.length === 0 ? (
          <p className="card text-center text-sm text-subtle">هنوز هزینه‌ای برای این آیتم ثبت نشده.</p>
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li key={e.id} className="card flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">
                    {e.description || EXPENSE_CATEGORY_LABELS[e.category]}
                    <span className="ms-2 text-[11px] font-normal text-secondary">
                      {EXPENSE_CATEGORY_LABELS[e.category]}
                    </span>
                  </div>
                  <div className="text-xs text-subtle">
                    {formatToman(e.amount)} · {formatDate(e.date)}
                    {e.contact && ` · ${e.contact.name}`}
                  </div>
                </div>
                <form action={boundDeleteExpense.bind(null, e.id)}>
                  <button type="submit" className="shrink-0 rounded-md border border-danger/40 px-2 py-1 text-xs text-danger">
                    حذف
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={boundAddExpense} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm text-subtle">نوع</span>
              <select name="category" defaultValue="REPAIR" className="input">
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm text-subtle">مبلغ (تومان)</span>
              <input name="amount" required inputMode="numeric" className="input" />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm text-subtle">توضیح</span>
            <input name="description" className="input" placeholder="مثلاً تعویض لامپ خروجی" />
          </label>
          {repairContacts.length > 0 && (
            <label className="block space-y-1">
              <span className="text-sm text-subtle">انجام‌شده توسط (اختیاری)</span>
              <select name="contactId" defaultValue="" className="input">
                <option value="">—</option>
                {repairContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-sm text-subtle">تاریخ</span>
            <input type="date" name="date" className="input" />
          </label>
          <button type="submit" className="btn-secondary">
            + افزودن هزینه
          </button>
        </form>
      </section>

      <form action={boundDelete}>
        <button type="submit" className="btn-danger-outline">
          حذف این آیتم
        </button>
      </form>
    </div>
  );
}

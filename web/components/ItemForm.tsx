import { STATUS_LABELS, SALE_CHANNEL_LABELS } from "@/lib/format";

type ItemDefaults = {
  status?: string;
  title?: string;
  brandModel?: string | null;
  city?: string | null;
  sourceUrl?: string | null;
  photos?: unknown;
  purchasePrice?: number | null;
  purchaseDate?: Date | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerNotes?: string | null;
  sellerContactId?: string | null;
  listedPrice?: number | null;
  saleChannel?: string | null;
  salePrice?: number | null;
  saleDate?: Date | null;
  notes?: string | null;
};

type ContactOption = { id: string; name: string };

function dateInputValue(d?: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function ItemForm({
  action,
  defaults,
  submitLabel,
  contacts = [],
}: {
  action: (formData: FormData) => void;
  defaults?: ItemDefaults;
  submitLabel: string;
  contacts?: ContactOption[];
}) {
  const photosText = Array.isArray(defaults?.photos) ? (defaults!.photos as string[]).join("\n") : "";

  return (
    <form action={action} className="space-y-5">
      <Field label="عنوان">
        <input name="title" defaultValue={defaults?.title} required className="input" placeholder="مثلاً رادیو گراندیگ لامپی" />
      </Field>

      <Field label="وضعیت">
        <select name="status" defaultValue={defaults?.status ?? "HUNTING"} className="input">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="برند/مدل">
          <input name="brandModel" defaultValue={defaults?.brandModel ?? ""} className="input" />
        </Field>
        <Field label="شهر">
          <input name="city" defaultValue={defaults?.city ?? ""} className="input" />
        </Field>
      </div>

      <Field label="لینک آگهی دیوار (اختیاری)">
        <input name="sourceUrl" defaultValue={defaults?.sourceUrl ?? ""} className="input" dir="ltr" placeholder="https://divar.ir/v/..." />
      </Field>

      <Field label="عکس‌ها (هر لینک در یک خط)">
        <textarea name="photos" defaultValue={photosText} rows={3} className="input" dir="ltr" />
      </Field>

      <fieldset className="space-y-3 rounded-lg border border-muted/30 p-3">
        <legend className="px-1 text-sm font-bold text-secondary">اطلاعات خرید</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label="قیمت خرید (تومان)">
            <input name="purchasePrice" defaultValue={defaults?.purchasePrice ?? ""} inputMode="numeric" className="input" />
          </Field>
          <Field label="تاریخ خرید">
            <input type="date" name="purchaseDate" defaultValue={dateInputValue(defaults?.purchaseDate)} className="input" />
          </Field>
        </div>
        {contacts.length > 0 && (
          <Field label="انتخاب از مخاطبین (اختیاری)">
            <select name="sellerContactId" defaultValue={defaults?.sellerContactId ?? ""} className="input">
              <option value="">— فروشنده جدید / یک‌باره —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="نام فروشنده">
            <input name="sellerName" defaultValue={defaults?.sellerName ?? ""} className="input" />
          </Field>
          <Field label="شماره فروشنده">
            <input name="sellerPhone" defaultValue={defaults?.sellerPhone ?? ""} className="input" dir="ltr" />
          </Field>
        </div>
        <Field label="یادداشت درباره فروشنده">
          <textarea name="sellerNotes" defaultValue={defaults?.sellerNotes ?? ""} rows={2} className="input" />
        </Field>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-muted/30 p-3">
        <legend className="px-1 text-sm font-bold text-secondary">اطلاعات فروش</legend>
        <Field label="قیمت درخواستی (تومان)">
          <input name="listedPrice" defaultValue={defaults?.listedPrice ?? ""} inputMode="numeric" className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="کانال فروش">
            <select name="saleChannel" defaultValue={defaults?.saleChannel ?? ""} className="input">
              <option value="">—</option>
              {Object.entries(SALE_CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="قیمت فروش (تومان)">
            <input name="salePrice" defaultValue={defaults?.salePrice ?? ""} inputMode="numeric" className="input" />
          </Field>
        </div>
        <Field label="تاریخ فروش">
          <input type="date" name="saleDate" defaultValue={dateInputValue(defaults?.saleDate)} className="input" />
        </Field>
      </fieldset>

      <Field label="یادداشت‌های عمومی">
        <textarea name="notes" defaultValue={defaults?.notes ?? ""} rows={3} className="input" />
      </Field>

      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-subtle">{label}</span>
      {children}
    </label>
  );
}

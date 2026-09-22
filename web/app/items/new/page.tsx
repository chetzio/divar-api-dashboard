import { prisma } from "@radiokar/core";
import ItemForm from "@/components/ItemForm";
import { createItem } from "../actions";

export default async function NewItemPage() {
  const contacts = await prisma.contact.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-4">
      <h1 className="heading">آیتم جدید</h1>
      <ItemForm action={createItem} submitLabel="ذخیره" contacts={contacts} />
    </div>
  );
}

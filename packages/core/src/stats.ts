import { prisma } from "./db";

const INVENTORY_STATUSES = new Set(["PURCHASED", "KEEPING", "LISTED"]);

export async function getLedgerStats() {
  const [items, expenseGroups] = await Promise.all([
    prisma.item.findMany({
      select: { id: true, status: true, purchasePrice: true, salePrice: true },
    }),
    prisma.expense.groupBy({ by: ["itemId"], _sum: { amount: true } }),
  ]);

  const expenseByItem = new Map(expenseGroups.map((g) => [g.itemId, g._sum.amount ?? 0]));

  let totalSpent = 0;
  let totalExpenses = 0;
  let totalEarned = 0;
  let realizedProfit = 0;
  let inventoryCount = 0;
  let inventoryCost = 0;

  for (const item of items) {
    const purchase = item.purchasePrice ?? 0;
    const expenses = expenseByItem.get(item.id) ?? 0;
    totalSpent += purchase + expenses;
    totalExpenses += expenses;

    if (item.status === "SOLD") {
      const sale = item.salePrice ?? 0;
      totalEarned += sale;
      realizedProfit += sale - purchase - expenses;
    } else if (INVENTORY_STATUSES.has(item.status)) {
      inventoryCount += 1;
      inventoryCost += purchase + expenses;
    }
  }

  return { totalSpent, totalEarned, realizedProfit, inventoryCount, inventoryCost, totalExpenses };
}

/** Monthly realized profit for SOLD items, most recent `months` months (oldest first). */
export async function getMonthlyProfit(months = 6) {
  const [soldItems, expenseGroups] = await Promise.all([
    prisma.item.findMany({
      where: { status: "SOLD" },
      select: { id: true, purchasePrice: true, salePrice: true, saleDate: true, updatedAt: true },
    }),
    prisma.expense.groupBy({ by: ["itemId"], _sum: { amount: true } }),
  ]);
  const expenseByItem = new Map(expenseGroups.map((g) => [g.itemId, g._sum.amount ?? 0]));

  const now = new Date();
  const buckets: { key: string; label: string; profit: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(d),
      profit: 0,
    });
  }
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));

  for (const item of soldItems) {
    const when = item.saleDate ?? item.updatedAt;
    const key = `${when.getFullYear()}-${when.getMonth()}`;
    const idx = bucketIndex.get(key);
    if (idx === undefined) continue;
    const purchase = item.purchasePrice ?? 0;
    const sale = item.salePrice ?? 0;
    const expenses = expenseByItem.get(item.id) ?? 0;
    buckets[idx].profit += sale - purchase - expenses;
  }

  return buckets;
}

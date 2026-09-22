-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "notifyEmail" TEXT;
ALTER TABLE "Setting" ADD COLUMN "notifyPhone" TEXT;
ALTER TABLE "Setting" ADD COLUMN "smsApiKey" TEXT;
ALTER TABLE "Setting" ADD COLUMN "smsProvider" TEXT;

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'REPAIR',
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contactId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Expense_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'HUNTING',
    "title" TEXT NOT NULL,
    "brandModel" TEXT,
    "city" TEXT,
    "postToken" TEXT,
    "sourceUrl" TEXT,
    "photos" JSONB NOT NULL DEFAULT [],
    "purchasePrice" INTEGER,
    "purchaseDate" DATETIME,
    "sellerName" TEXT,
    "sellerPhone" TEXT,
    "sellerNotes" TEXT,
    "sellerContactId" TEXT,
    "listedPrice" INTEGER,
    "saleChannel" TEXT,
    "salePrice" INTEGER,
    "saleDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_sellerContactId_fkey" FOREIGN KEY ("sellerContactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("brandModel", "city", "createdAt", "id", "listedPrice", "notes", "photos", "postToken", "purchaseDate", "purchasePrice", "saleChannel", "saleDate", "salePrice", "sellerName", "sellerNotes", "sellerPhone", "sourceUrl", "status", "title", "updatedAt") SELECT "brandModel", "city", "createdAt", "id", "listedPrice", "notes", "photos", "postToken", "purchaseDate", "purchasePrice", "saleChannel", "saleDate", "salePrice", "sellerName", "sellerNotes", "sellerPhone", "sourceUrl", "status", "title", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "Item" (
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
    "listedPrice" INTEGER,
    "saleChannel" TEXT,
    "salePrice" INTEGER,
    "saleDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "cities" JSONB NOT NULL DEFAULT [],
    "category" TEXT,
    "intervalMinutes" INTEGER NOT NULL DEFAULT 20,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastPolledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "savedSearchId" TEXT NOT NULL,
    "postToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER,
    "city" TEXT,
    "photoUrl" TEXT,
    "foundAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    CONSTRAINT "Candidate_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "SavedSearch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "telegramChatId" TEXT,
    "kenarApiKey" TEXT,
    "finderCallsUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_savedSearchId_postToken_key" ON "Candidate"("savedSearchId", "postToken");

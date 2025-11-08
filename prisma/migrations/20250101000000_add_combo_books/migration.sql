-- AlterTable
ALTER TABLE "books" ADD COLUMN "isCombo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "combo_book_items" (
    "id" TEXT NOT NULL,
    "comboBookId" TEXT NOT NULL,
    "componentBookId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_book_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combo_book_items_comboBookId_componentBookId_key" ON "combo_book_items"("comboBookId", "componentBookId");

-- AddForeignKey
ALTER TABLE "combo_book_items" ADD CONSTRAINT "combo_book_items_comboBookId_fkey" FOREIGN KEY ("comboBookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_book_items" ADD CONSTRAINT "combo_book_items_componentBookId_fkey" FOREIGN KEY ("componentBookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;


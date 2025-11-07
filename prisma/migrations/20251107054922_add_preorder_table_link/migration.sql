/*
  Warnings:

  - A unique constraint covering the columns `[slipNumber]` on the table `book_sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "preorder_sessions" ADD COLUMN     "tableSaleSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "book_sales_slipNumber_key" ON "book_sales"("slipNumber");

-- AddForeignKey
ALTER TABLE "preorder_sessions" ADD CONSTRAINT "preorder_sessions_tableSaleSessionId_fkey" FOREIGN KEY ("tableSaleSessionId") REFERENCES "table_sale_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

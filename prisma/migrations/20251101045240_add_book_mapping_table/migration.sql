-- CreateTable
CREATE TABLE "book_mappings" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_mappings_productName_key" ON "book_mappings"("productName");

-- AddForeignKey
ALTER TABLE "book_mappings" ADD CONSTRAINT "book_mappings_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

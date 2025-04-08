/*
  Warnings:

  - You are about to drop the `Consolidation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PreOrder` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "mainStoreData" JSONB;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Consolidation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OrderItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PreOrder";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "pre_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "isPartiallyCollected" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" DATETIME,
    "shippingZone" TEXT,
    "orderStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "total" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "productName" TEXT NOT NULL,
    "consolidationId" INTEGER,
    CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pre_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_consolidationId_fkey" FOREIGN KEY ("consolidationId") REFERENCES "consolidations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consolidations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "session" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "orderId" TEXT,
    CONSTRAINT "consolidations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "consolidations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pre_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "preorder_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "table_sale_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "salesPersonId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "soldData" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "my_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "tableSaleSessionId" TEXT,
    "miniStoreSessionId" TEXT,
    "mainStoreSessionId" TEXT,
    "preorderSessionId" TEXT,
    CONSTRAINT "my_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "my_sessions_tableSaleSessionId_fkey" FOREIGN KEY ("tableSaleSessionId") REFERENCES "table_sale_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "my_sessions_miniStoreSessionId_fkey" FOREIGN KEY ("miniStoreSessionId") REFERENCES "mini_store_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "my_sessions_mainStoreSessionId_fkey" FOREIGN KEY ("mainStoreSessionId") REFERENCES "main_store_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "my_sessions_preorderSessionId_fkey" FOREIGN KEY ("preorderSessionId") REFERENCES "preorder_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mini_store_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "collectedData" JSONB NOT NULL,
    "distributedData" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "main_store_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "collectedData" JSONB NOT NULL,
    "distributedData" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "preorderTotal" INTEGER NOT NULL,
    "preorderAvailable" INTEGER NOT NULL,
    "salesTotal" INTEGER NOT NULL,
    "salesAvailable" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "book_sales" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "purchasedAt" DATETIME,
    "orderStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "total" REAL NOT NULL DEFAULT 0,
    "sessionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "book_sales_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sale_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "book_sale_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookSaleId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "book_sale_items_bookSaleId_fkey" FOREIGN KEY ("bookSaleId") REFERENCES "book_sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "book_sale_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

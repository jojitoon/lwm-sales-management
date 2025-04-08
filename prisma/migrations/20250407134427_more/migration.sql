-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_main_store_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "collectedData" JSONB,
    "distributedData" JSONB,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_main_store_sessions" ("collectedData", "createdAt", "data", "distributedData", "id", "isActive", "managerId", "name", "session", "updatedAt") SELECT "collectedData", "createdAt", "data", "distributedData", "id", "isActive", "managerId", "name", "session", "updatedAt" FROM "main_store_sessions";
DROP TABLE "main_store_sessions";
ALTER TABLE "new_main_store_sessions" RENAME TO "main_store_sessions";
CREATE TABLE "new_mini_store_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "collectedData" JSONB,
    "distributedData" JSONB,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_mini_store_sessions" ("collectedData", "createdAt", "data", "distributedData", "id", "isActive", "managerId", "session", "updatedAt") SELECT "collectedData", "createdAt", "data", "distributedData", "id", "isActive", "managerId", "session", "updatedAt" FROM "mini_store_sessions";
DROP TABLE "mini_store_sessions";
ALTER TABLE "new_mini_store_sessions" RENAME TO "mini_store_sessions";
CREATE TABLE "new_my_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "data" JSONB,
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
INSERT INTO "new_my_sessions" ("createdAt", "data", "id", "isActive", "mainStoreSessionId", "miniStoreSessionId", "preorderSessionId", "session", "tableSaleSessionId", "updatedAt", "userId") SELECT "createdAt", "data", "id", "isActive", "mainStoreSessionId", "miniStoreSessionId", "preorderSessionId", "session", "tableSaleSessionId", "updatedAt", "userId" FROM "my_sessions";
DROP TABLE "my_sessions";
ALTER TABLE "new_my_sessions" RENAME TO "my_sessions";
CREATE TABLE "new_table_sale_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "salesPersonId" TEXT,
    "data" JSONB,
    "soldData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_table_sale_sessions" ("createdAt", "data", "id", "isActive", "managerId", "name", "salesPersonId", "session", "soldData", "tableId", "updatedAt") SELECT "createdAt", "data", "id", "isActive", "managerId", "name", "salesPersonId", "session", "soldData", "tableId", "updatedAt" FROM "table_sale_sessions";
DROP TABLE "table_sale_sessions";
ALTER TABLE "new_table_sale_sessions" RENAME TO "table_sale_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

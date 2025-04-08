/*
  Warnings:

  - Added the required column `workspace` to the `my_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_my_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

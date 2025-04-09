-- CreateTable
CREATE TABLE "main_store_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mainStoreSessionId" TEXT NOT NULL,
    "miniStoreSessionId" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "granted" JSONB NOT NULL,
    "wasDenied" BOOLEAN NOT NULL DEFAULT false,
    "wasApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mini_store_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "miniStoreSessionId" TEXT NOT NULL,
    "tableSaleSessionId" TEXT,
    "preorderSessionId" TEXT,
    "request" JSONB NOT NULL,
    "granted" JSONB NOT NULL,
    "wasDenied" BOOLEAN NOT NULL DEFAULT false,
    "wasApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "currentSession" TEXT DEFAULT 'FIRST_SESSION',
    "adminPassword" TEXT,
    "mainStoreData" JSONB,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "isPartiallyCollected" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3),
    "shippingZone" TEXT,
    "orderStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isCollected" BOOLEAN NOT NULL DEFAULT false,
    "productName" TEXT NOT NULL,
    "bookId" TEXT,
    "consolidationId" INTEGER,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidations" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "consolidations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preorder_sessions" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preorder_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_sale_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "salesPersonId" TEXT,
    "data" JSONB,
    "soldData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_sale_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "my_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tableSaleSessionId" TEXT,
    "miniStoreSessionId" TEXT,
    "mainStoreSessionId" TEXT,
    "preorderSessionId" TEXT,

    CONSTRAINT "my_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mini_store_sessions" (
    "id" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "collectedData" JSONB,
    "distributedData" JSONB,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_store_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_store_sessions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "managerId" TEXT,
    "collectedData" JSONB,
    "distributedData" JSONB,
    "data" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_store_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "main_store_requests" (
    "id" TEXT NOT NULL,
    "mainStoreSessionId" TEXT NOT NULL,
    "miniStoreSessionId" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "granted" JSONB NOT NULL,
    "wasDenied" BOOLEAN NOT NULL DEFAULT false,
    "wasApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_store_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mini_store_requests" (
    "id" TEXT NOT NULL,
    "miniStoreSessionId" TEXT NOT NULL,
    "tableSaleSessionId" TEXT,
    "preorderSessionId" TEXT,
    "request" JSONB NOT NULL,
    "granted" JSONB NOT NULL,
    "wasDenied" BOOLEAN NOT NULL DEFAULT false,
    "wasApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_store_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "available" INTEGER NOT NULL,
    "preorderTotal" INTEGER NOT NULL,
    "preorderAvailable" INTEGER NOT NULL,
    "salesTotal" INTEGER NOT NULL,
    "salesAvailable" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_sales" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "purchasedAt" TIMESTAMP(3),
    "orderStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_sale_items" (
    "id" TEXT NOT NULL,
    "bookSaleId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pre_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_consolidationId_fkey" FOREIGN KEY ("consolidationId") REFERENCES "consolidations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidations" ADD CONSTRAINT "consolidations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "pre_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_sessions" ADD CONSTRAINT "my_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_sessions" ADD CONSTRAINT "my_sessions_tableSaleSessionId_fkey" FOREIGN KEY ("tableSaleSessionId") REFERENCES "table_sale_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_sessions" ADD CONSTRAINT "my_sessions_miniStoreSessionId_fkey" FOREIGN KEY ("miniStoreSessionId") REFERENCES "mini_store_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_sessions" ADD CONSTRAINT "my_sessions_mainStoreSessionId_fkey" FOREIGN KEY ("mainStoreSessionId") REFERENCES "main_store_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "my_sessions" ADD CONSTRAINT "my_sessions_preorderSessionId_fkey" FOREIGN KEY ("preorderSessionId") REFERENCES "preorder_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_sales" ADD CONSTRAINT "book_sales_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "table_sale_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_sale_items" ADD CONSTRAINT "book_sale_items_bookSaleId_fkey" FOREIGN KEY ("bookSaleId") REFERENCES "book_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_sale_items" ADD CONSTRAINT "book_sale_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

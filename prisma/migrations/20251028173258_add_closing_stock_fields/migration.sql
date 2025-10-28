-- AlterTable
ALTER TABLE "main_store_sessions" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closingStock" JSONB;

-- AlterTable
ALTER TABLE "mini_store_sessions" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closingStock" JSONB;

-- AddForeignKey
ALTER TABLE "main_store_requests" ADD CONSTRAINT "main_store_requests_mainStoreSessionId_fkey" FOREIGN KEY ("mainStoreSessionId") REFERENCES "main_store_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "main_store_requests" ADD CONSTRAINT "main_store_requests_miniStoreSessionId_fkey" FOREIGN KEY ("miniStoreSessionId") REFERENCES "mini_store_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_store_requests" ADD CONSTRAINT "mini_store_requests_miniStoreSessionId_fkey" FOREIGN KEY ("miniStoreSessionId") REFERENCES "mini_store_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_store_requests" ADD CONSTRAINT "mini_store_requests_tableSaleSessionId_fkey" FOREIGN KEY ("tableSaleSessionId") REFERENCES "table_sale_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_store_requests" ADD CONSTRAINT "mini_store_requests_preorderSessionId_fkey" FOREIGN KEY ("preorderSessionId") REFERENCES "preorder_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

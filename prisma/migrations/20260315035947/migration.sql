/*
  Warnings:

  - You are about to drop the column `stripeSessionId` on the `orders` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "orders_stripeSessionId_key";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "stripeSessionId";

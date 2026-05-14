-- CreateEnum
CREATE TYPE "CustomerIssueType" AS ENUM ('SHIPPING_DELAY', 'WRONG_ITEM', 'REFUND_REQUEST', 'PRODUCT_QUESTION', 'PAYMENT_ISSUE', 'SUPPLIER_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerIssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CustomerIssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "CustomerIssue" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CustomerIssueType" NOT NULL DEFAULT 'OTHER',
    "status" "CustomerIssueStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CustomerIssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "customerName" TEXT,
    "customerEmail" TEXT,
    "orderId" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerIssue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

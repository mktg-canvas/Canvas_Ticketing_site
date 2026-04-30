-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('client', 'fm');

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "source" "TicketSource" NOT NULL DEFAULT 'client';

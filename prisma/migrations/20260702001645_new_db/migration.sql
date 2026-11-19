/*
  Warnings:

  - You are about to drop the column `resetExpies` on the `Developer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "resetExpies",
ADD COLUMN     "resetExpires" TIMESTAMP(3);

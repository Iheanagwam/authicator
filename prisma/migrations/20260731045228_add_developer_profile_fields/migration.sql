/*
  Warnings:

  - You are about to drop the column `resetExpires` on the `Developer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Developer" DROP COLUMN "resetExpires",
ADD COLUMN     "country" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "fullname" TEXT,
ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "resetExpiry" TIMESTAMP(3),
ADD COLUMN     "zipcode" TEXT;

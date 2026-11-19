/*
  Warnings:

  - Added the required column `updatedAt` to the `Developer` table without a default value. This is not possible if the table is not empty.
  - Made the column `apiKey` on table `Developer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `EndUser` table without a default value. This is not possible if the table is not empty.
  - Made the column `developerId` on table `EndUser` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "EndUser" DROP CONSTRAINT "EndUser_developerId_fkey";

-- AlterTable
ALTER TABLE "Developer" ADD COLUMN     "fieldConfig" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "apiKey" SET NOT NULL;

-- AlterTable
ALTER TABLE "EndUser" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "resetExpiry" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "developerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "EndUser" ADD CONSTRAINT "EndUser_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

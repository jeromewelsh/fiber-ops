/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `Cable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nodeId,name]` on the table `SpliceTray` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Cable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Fiber` table without a default value. This is not possible if the table is not empty.
  - Made the column `bufferNumber` on table `Fiber` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `Fiber` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Node` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Splice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SpliceTray` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Splice" DROP CONSTRAINT "Splice_aFiberId_fkey";

-- DropForeignKey
ALTER TABLE "Splice" DROP CONSTRAINT "Splice_bFiberId_fkey";

-- AlterTable
ALTER TABLE "Cable" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Fiber" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "bufferNumber" SET NOT NULL,
ALTER COLUMN "color" SET NOT NULL;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Splice" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "lossDb" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SpliceTray" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Cable_projectId_idx" ON "Cable"("projectId");

-- CreateIndex
CREATE INDEX "Cable_fromNodeId_idx" ON "Cable"("fromNodeId");

-- CreateIndex
CREATE INDEX "Cable_toNodeId_idx" ON "Cable"("toNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Cable_projectId_name_key" ON "Cable"("projectId", "name");

-- CreateIndex
CREATE INDEX "Node_projectId_idx" ON "Node"("projectId");

-- CreateIndex
CREATE INDEX "Node_name_idx" ON "Node"("name");

-- CreateIndex
CREATE INDEX "Splice_trayId_idx" ON "Splice"("trayId");

-- CreateIndex
CREATE INDEX "SpliceTray_nodeId_idx" ON "SpliceTray"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SpliceTray_nodeId_name_key" ON "SpliceTray"("nodeId", "name");

-- AddForeignKey
ALTER TABLE "Splice" ADD CONSTRAINT "Splice_aFiberId_fkey" FOREIGN KEY ("aFiberId") REFERENCES "Fiber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Splice" ADD CONSTRAINT "Splice_bFiberId_fkey" FOREIGN KEY ("bFiberId") REFERENCES "Fiber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

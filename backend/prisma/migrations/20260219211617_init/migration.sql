-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('CABINET', 'SPLICE_CLOSURE', 'HANDHOLE', 'POLE', 'BUILDING');

-- CreateEnum
CREATE TYPE "CableType" AS ENUM ('BACKBONE', 'SPUR', 'DROP');

-- CreateEnum
CREATE TYPE "FiberStatus" AS ENUM ('DARK', 'RESERVED', 'LIT', 'BROKEN');

-- CreateEnum
CREATE TYPE "SpliceType" AS ENUM ('FUSION', 'MECH');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nodeType" "NodeType" NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mileMarker" TEXT,
    "notes" TEXT,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cable" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cableType" "CableType" NOT NULL,
    "fiberCount" INTEGER NOT NULL,
    "routeNotes" TEXT,
    "fromNodeId" TEXT,
    "toNodeId" TEXT,

    CONSTRAINT "Cable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fiber" (
    "id" TEXT NOT NULL,
    "cableId" TEXT NOT NULL,
    "strandNumber" INTEGER NOT NULL,
    "bufferNumber" INTEGER,
    "color" TEXT,
    "status" "FiberStatus" NOT NULL DEFAULT 'DARK',

    CONSTRAINT "Fiber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpliceTray" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SpliceTray_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Splice" (
    "id" TEXT NOT NULL,
    "trayId" TEXT NOT NULL,
    "aFiberId" TEXT NOT NULL,
    "bFiberId" TEXT NOT NULL,
    "position" TEXT,
    "spliceType" "SpliceType" NOT NULL DEFAULT 'FUSION',
    "lossDb" DECIMAL(6,3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Splice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fiber_cableId_idx" ON "Fiber"("cableId");

-- CreateIndex
CREATE UNIQUE INDEX "Fiber_cableId_strandNumber_key" ON "Fiber"("cableId", "strandNumber");

-- CreateIndex
CREATE INDEX "Splice_aFiberId_idx" ON "Splice"("aFiberId");

-- CreateIndex
CREATE INDEX "Splice_bFiberId_idx" ON "Splice"("bFiberId");

-- CreateIndex
CREATE UNIQUE INDEX "Splice_trayId_aFiberId_bFiberId_key" ON "Splice"("trayId", "aFiberId", "bFiberId");

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cable" ADD CONSTRAINT "Cable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cable" ADD CONSTRAINT "Cable_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cable" ADD CONSTRAINT "Cable_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fiber" ADD CONSTRAINT "Fiber_cableId_fkey" FOREIGN KEY ("cableId") REFERENCES "Cable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpliceTray" ADD CONSTRAINT "SpliceTray_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Splice" ADD CONSTRAINT "Splice_trayId_fkey" FOREIGN KEY ("trayId") REFERENCES "SpliceTray"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Splice" ADD CONSTRAINT "Splice_aFiberId_fkey" FOREIGN KEY ("aFiberId") REFERENCES "Fiber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Splice" ADD CONSTRAINT "Splice_bFiberId_fkey" FOREIGN KEY ("bFiberId") REFERENCES "Fiber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

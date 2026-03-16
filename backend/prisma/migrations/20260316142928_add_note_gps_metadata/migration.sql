-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "gpsAccuracy" DOUBLE PRECISION,
ADD COLUMN     "gpsCapturedAt" TIMESTAMP(3),
ADD COLUMN     "gpsSource" TEXT;

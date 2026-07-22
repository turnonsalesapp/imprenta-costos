-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "interpretarIA" BOOLEAN;

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "interpretarIA" BOOLEAN NOT NULL DEFAULT false;


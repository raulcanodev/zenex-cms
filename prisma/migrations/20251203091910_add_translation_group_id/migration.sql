-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "translationGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Post_translationGroupId_idx" ON "Post"("translationGroupId");

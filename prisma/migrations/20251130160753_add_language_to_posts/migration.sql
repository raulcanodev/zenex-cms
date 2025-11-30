-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- CreateIndex
CREATE INDEX "Post_blogId_language_idx" ON "Post"("blogId", "language");

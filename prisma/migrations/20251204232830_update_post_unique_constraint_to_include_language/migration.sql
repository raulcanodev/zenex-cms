-- DropIndex
DROP INDEX IF EXISTS "Post_blogId_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Post_blogId_slug_language_key" ON "Post"("blogId", "slug", "language");

-- CreateTable
CREATE TABLE "BlogMember" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogMember_blogId_idx" ON "BlogMember"("blogId");

-- CreateIndex
CREATE INDEX "BlogMember_userEmail_idx" ON "BlogMember"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "BlogMember_blogId_userEmail_key" ON "BlogMember"("blogId", "userEmail");

-- AddForeignKey
ALTER TABLE "BlogMember" ADD CONSTRAINT "BlogMember_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

"use server";

import { prisma } from "@/lib/prisma";

export async function getAuthorsByBlogId(blogId: string) {
  return await prisma.author.findMany({
    where: { blogId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAuthorById(id: string) {
  return await prisma.author.findUnique({
    where: { id },
  });
}

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getBlogsByUserId(userId: string) {
  return prisma.blog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function getBlogById(id: string) {
  return prisma.blog.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function getBlogByBlogId(blogId: string) {
  return unstable_cache(
    async () => {
      return prisma.blog.findUnique({
        where: { blogId },
      });
    },
    [`blog-${blogId}`],
    {
      revalidate: 3600, // 1 hour
    }
  )();
}



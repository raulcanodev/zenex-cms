import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getCategoriesByBlogId(blogId: string) {
  return prisma.category.findMany({
    where: {
      blogId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  });
}

export async function getCategoriesByBlogIdCached(blogId: string) {
  return unstable_cache(
    async () => {
      return getCategoriesByBlogId(blogId);
    },
    [`categories-${blogId}`],
    {
      revalidate: 3600,
    }
  )();
}


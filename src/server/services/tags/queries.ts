import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getTagsByBlogId(blogId: string) {
  return prisma.tag.findMany({
    where: {
      blogId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getTagsByBlogIdCached(blogId: string) {
  return unstable_cache(
    async () => {
      return getTagsByBlogId(blogId);
    },
    [`tags-${blogId}`],
    {
      revalidate: 3600,
    }
  )();
}


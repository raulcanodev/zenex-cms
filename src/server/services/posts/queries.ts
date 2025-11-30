import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getPostsByBlogId(
  blogId: string,
  options?: {
    status?: string;
    categoryId?: string;
    language?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;

  const where: {
    blogId: string;
    status?: string;
    language?: string;
    categories?: {
      some: {
        categoryId: string;
      };
    };
  } = {
    blogId,
  };

  if (options?.status) {
    where.status = options.status;
  }

  if (options?.language) {
    where.language = options.language;
  }

  if (options?.categoryId) {
    where.categories = {
      some: {
        categoryId: options.categoryId,
      },
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function getPostBySlug(blogId: string, slug: string) {
  return unstable_cache(
    async () => {
      return prisma.post.findUnique({
        where: {
          blogId_slug: {
            blogId,
            slug,
          },
        },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    },
    [`post-${blogId}-${slug}`],
    {
      revalidate: 3600,
    }
  )();
}



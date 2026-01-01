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
    orderBy?: "publishedAt" | "createdAt" | "title";
    order?: "asc" | "desc";
  }
) {
  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const skip = (page - 1) * limit;
  const orderByField = options?.orderBy || "publishedAt";
  const orderDirection = options?.order || "desc";

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

  // Cache published posts for API consumption (60 seconds)
  // Don't cache drafts or admin queries
  const shouldCache = options?.status === "published";

  const fetchPosts = async () => {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            [orderByField]: orderDirection,
          },
          {
            createdAt: "desc",
          },
        ],
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
  };

  if (shouldCache) {
    return unstable_cache(
      fetchPosts,
      [`posts-${blogId}-${page}-${limit}-${options?.status}-${options?.categoryId}-${options?.language}-${orderByField}-${orderDirection}`],
      {
        revalidate: 60,
        tags: [`blog-${blogId}-posts`],
      }
    )();
  }

  return fetchPosts();
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
      return prisma.post.findFirst({
        where: {
          blogId,
          slug,
          status: "published",
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
        orderBy: {
          createdAt: "desc",
        },
      });
    },
    [`post-${blogId}-${slug}`],
    {
      revalidate: 3600,
    }
  )();
}

/**
 * Get all posts that belong to the same translation group
 */
export async function getPostsByTranslationGroup(translationGroupId: string) {
  return prisma.post.findMany({
    where: {
      translationGroupId,
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
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Get a post by slug and specific language
 */
export async function getPostBySlugAndLanguage(
  blogId: string,
  slug: string,
  language: string
) {
  return unstable_cache(
    async () => {
      return prisma.post.findFirst({
        where: {
          blogId,
          slug,
          language,
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
    [`post-${blogId}-${slug}-${language}`],
    {
      revalidate: 3600,
    }
  )();
}

/**
 * Get available languages for a post by its ID (using translationGroupId)
 */
export async function getAvailableLanguagesForPost(postId: string): Promise<string[]> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { translationGroupId: true },
  });

  if (!post || !post.translationGroupId) {
    // If post doesn't have a translation group, return only its own language
    const singlePost = await prisma.post.findUnique({
      where: { id: postId },
      select: { language: true },
    });
    return singlePost?.language ? [singlePost.language] : [];
  }

  const posts = await prisma.post.findMany({
    where: {
      translationGroupId: post.translationGroupId,
    },
    select: {
      language: true,
    },
  });

  return posts.map((p) => p.language).filter(Boolean);
}

/**
 * Get available languages for a post by slug (using translationGroupId)
 */
export async function getAvailableLanguagesBySlug(
  blogId: string,
  slug: string
): Promise<string[]> {
  const post = await prisma.post.findFirst({
    where: {
      blogId,
      slug,
    },
    select: {
      translationGroupId: true,
      language: true,
    },
  });

  if (!post) {
    return [];
  }

  if (!post.translationGroupId) {
    // If post doesn't have a translation group, return only its own language
    return post.language ? [post.language] : [];
  }

  const posts = await prisma.post.findMany({
    where: {
      translationGroupId: post.translationGroupId,
    },
    select: {
      language: true,
    },
  });

  return posts.map((p) => p.language).filter(Boolean);
}



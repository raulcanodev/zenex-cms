import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getBlogsByUserId(userId: string, userEmail?: string) {
  // Get blogs where user is owner
  const ownedBlogs = await prisma.blog.findMany({
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

  // Get blogs where user is member (if email provided)
  let memberBlogs: typeof ownedBlogs = [];
  if (userEmail) {
    const memberRecords = await prisma.blogMember.findMany({
      where: {
        userEmail: userEmail.toLowerCase().trim(),
      },
      include: {
        blog: {
          include: {
            _count: {
              select: {
                posts: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    memberBlogs = memberRecords
      .map((record) => record.blog)
      .filter((blog) => blog.userId !== userId); // Exclude blogs user already owns
  }

  // Combine and deduplicate by id
  const allBlogs = [...ownedBlogs, ...memberBlogs];
  const uniqueBlogs = Array.from(
    new Map(allBlogs.map((blog) => [blog.id, blog])).values()
  );

  // Sort by creation date
  return uniqueBlogs.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
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



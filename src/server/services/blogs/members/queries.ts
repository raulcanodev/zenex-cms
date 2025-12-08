import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";

export interface BlogMemberWithUser {
  id: string;
  userEmail: string;
  createdAt: Date;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

/**
 * Get all members of a blog (including owner)
 */
export async function getBlogMembers(blogId: string): Promise<{
  error?: string;
  members?: BlogMemberWithUser[];
  ownerEmail?: string;
  ownerUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}> {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.email) {
    return { error: "Unauthorized" };
  }

  try {
    // Get blog to verify access and get owner email
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!blog) {
      return { error: "Blog not found" };
    }

    // Check if user has access (owner or member)
    const isOwner = blog.userId === session.user.id;
    const isMember = await prisma.blogMember.findFirst({
      where: {
        blogId,
        userEmail: session.user.email,
      },
    });

    if (!isOwner && !isMember) {
      return { error: "Unauthorized" };
    }

    // Get all members
    const members = await prisma.blogMember.findMany({
      where: { blogId },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Map members with user info if user exists
    const membersWithUser: BlogMemberWithUser[] = await Promise.all(
      members.map(async (member) => {
        const user = await prisma.user.findUnique({
          where: { email: member.userEmail },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        return {
          id: member.id,
          userEmail: member.userEmail,
          createdAt: member.createdAt,
          user: user || null,
        };
      })
    );

    return {
      members: membersWithUser,
      ownerEmail: blog.user.email,
      ownerUser: blog.user,
    };
  } catch (error) {
    console.error("Error fetching blog members:", error);
    return { error: "Failed to fetch blog members" };
  }
}


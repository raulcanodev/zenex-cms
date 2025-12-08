"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const emailSchema = z.string().email("Invalid email format");

/**
 * Check if user has access to blog (owner or member)
 */
export async function userHasAccessToBlog(
  userId: string,
  userEmail: string,
  blogId: string
): Promise<boolean> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return false;
    }

    // Check if user is owner
    if (blog.userId === userId) {
      return true;
    }

    // Check if user is member
    const member = await prisma.blogMember.findFirst({
      where: {
        blogId,
        userEmail,
      },
    });

    return !!member;
  } catch (error) {
    console.error("Error checking blog access:", error);
    return false;
  }
}

/**
 * Add a member to a blog
 */
export async function addBlogMember(blogId: string, email: string) {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.email) {
    return { error: "Unauthorized" };
  }

  try {
    // Validate email format
    const validatedEmail = emailSchema.parse(email.toLowerCase().trim());

    // Get blog and verify ownership
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!blog) {
      return { error: "Blog not found" };
    }

    // Only owner can add members
    if (blog.userId !== session.user.id) {
      return { error: "Unauthorized: Only the blog owner can add members" };
    }

    // Cannot add owner as member (owner already has access)
    if (blog.user.email === validatedEmail) {
      return { error: "The blog owner is already a member" };
    }

    // Check if member already exists
    const existingMember = await prisma.blogMember.findFirst({
      where: {
        blogId,
        userEmail: validatedEmail,
      },
    });

    if (existingMember) {
      return { error: "This email is already a member of this blog" };
    }

    // Add member
    const member = await prisma.blogMember.create({
      data: {
        blogId,
        userEmail: validatedEmail,
      },
    });

    revalidatePath(`/dashboard/blogs/${blogId}/settings`);
    revalidatePath("/dashboard");
    return { success: true, member };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    console.error("Error adding blog member:", error);
    return { error: "Failed to add blog member" };
  }
}

/**
 * Remove a member from a blog
 */
export async function removeBlogMember(blogId: string, memberId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get blog and verify ownership
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return { error: "Blog not found" };
    }

    // Only owner can remove members
    if (blog.userId !== session.user.id) {
      return { error: "Unauthorized: Only the blog owner can remove members" };
    }

    // Get member to verify it exists and belongs to this blog
    const member = await prisma.blogMember.findFirst({
      where: {
        id: memberId,
        blogId,
      },
    });

    if (!member) {
      return { error: "Member not found" };
    }

    // Remove member
    await prisma.blogMember.delete({
      where: { id: memberId },
    });

    revalidatePath(`/dashboard/blogs/${blogId}/settings`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error removing blog member:", error);
    return { error: "Failed to remove blog member" };
  }
}





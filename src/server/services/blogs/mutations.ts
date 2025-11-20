"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const createBlogSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

const updateBlogSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function createBlog(data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const validated = createBlogSchema.parse(data);

    // Check if slug already exists for this user
    const existingBlog = await prisma.blog.findFirst({
      where: {
        userId: session.user.id,
        slug: validated.slug,
      },
    });

    if (existingBlog) {
      return { error: "Blog with this slug already exists" };
    }

    const blog = await prisma.blog.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, blog };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to create blog" };
  }
}

export async function updateBlog(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const validated = updateBlogSchema.partial().parse(data);

    // Check ownership
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog || blog.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    // Check slug uniqueness if updating slug
    if (validated.slug && validated.slug !== blog.slug) {
      const existingBlog = await prisma.blog.findFirst({
        where: {
          userId: session.user.id,
          slug: validated.slug,
          id: { not: id },
        },
      });

      if (existingBlog) {
        return { error: "Blog with this slug already exists" };
      }
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: validated,
    });

    revalidatePath(`/dashboard/blogs/${id}`);
    revalidatePath(`/dashboard/blogs/${id}/settings`);
    return { success: true, blog: updatedBlog };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to update blog" };
  }
}

export async function deleteBlog(id: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog || blog.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await prisma.blog.delete({
      where: { id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete blog" };
  }
}


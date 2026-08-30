"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";

const createCategorySchema = z.object({
  blogId: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function createCategory(data: {
  blogId: string;
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify blog access
    const blog = await prisma.blog.findUnique({
      where: { id: data.blogId },
    });

    if (!blog) {
      return { error: "Blog not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      data.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    const validated = createCategorySchema.parse(data);

    // Check if slug already exists for this blog
    const existingCategory = await prisma.category.findUnique({
      where: {
        blogId_slug: {
          blogId: data.blogId,
          slug: validated.slug,
        },
      },
    });

    if (existingCategory) {
      return { error: "Category with this slug already exists" };
    }

    const category = await prisma.category.create({
      data: validated,
    });

    updateTag(`blog-${data.blogId}-categories`);
    revalidatePath(`/api/blogs/${data.blogId}/categories`);
    revalidatePath(`/dashboard/blogs/${data.blogId}`);
    return { success: true, category };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!category) {
      return { error: "Category not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      category.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    const validated = updateCategorySchema.partial().parse(data);

    // Check slug uniqueness if updating slug
    if (validated.slug && validated.slug !== category.slug) {
      const existingCategory = await prisma.category.findUnique({
        where: {
          blogId_slug: {
            blogId: category.blogId,
            slug: validated.slug,
          },
        },
      });

      if (existingCategory) {
        return { error: "Category with this slug already exists" };
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validated,
    });

    updateTag(`blog-${category.blogId}-categories`);
    updateTag(`blog-${category.blogId}-posts`);
    revalidatePath(`/api/blogs/${category.blogId}/categories`);
    revalidatePath(`/dashboard/blogs/${category.blogId}`);
    return { success: true, category: updatedCategory };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!category) {
      return { error: "Category not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      category.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    await prisma.category.delete({
      where: { id },
    });

    updateTag(`blog-${category.blogId}-categories`);
    updateTag(`blog-${category.blogId}-posts`);
    revalidatePath(`/api/blogs/${category.blogId}/categories`);
    revalidatePath(`/dashboard/blogs/${category.blogId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}

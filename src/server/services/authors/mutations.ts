"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";

const createAuthorSchema = z.object({
  blogId: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  slug: z.string().min(1),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

const updateAuthorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  slug: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
});

export async function createAuthor(data: {
  blogId: string;
  name: string;
  email: string;
  slug: string;
  bio?: string;
  avatar?: string;
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

    const validated = createAuthorSchema.parse(data);

    // Check if email already exists for this blog
    const existingAuthor = await prisma.author.findUnique({
      where: {
        blogId_email: {
          blogId: data.blogId,
          email: validated.email,
        },
      },
    });

    if (existingAuthor) {
      return { error: "Author with this email already exists" };
    }

    // Check if slug already exists for this blog
    const existingSlug = await prisma.author.findUnique({
      where: {
        blogId_slug: {
          blogId: data.blogId,
          slug: validated.slug,
        },
      },
    });

    if (existingSlug) {
      return { error: "Author with this slug already exists" };
    }

    const author = await prisma.author.create({
      data: validated,
    });

    revalidatePath(`/dashboard/blogs/${data.blogId}`);
    return { success: true, author };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to create author" };
  }
}

export async function updateAuthor(
  id: string,
  data: {
    name?: string;
    email?: string;
    slug?: string;
    bio?: string;
    avatar?: string;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!author) {
      return { error: "Author not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      author.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    const validated = updateAuthorSchema.partial().parse(data);

    // Check email uniqueness if updating email
    if (validated.email && validated.email !== author.email) {
      const existingAuthor = await prisma.author.findUnique({
        where: {
          blogId_email: {
            blogId: author.blogId,
            email: validated.email,
          },
        },
      });

      if (existingAuthor) {
        return { error: "Author with this email already exists" };
      }
    }

    // Check slug uniqueness if updating slug
    if (validated.slug && validated.slug !== author.slug) {
      const existingSlug = await prisma.author.findUnique({
        where: {
          blogId_slug: {
            blogId: author.blogId,
            slug: validated.slug,
          },
        },
      });

      if (existingSlug) {
        return { error: "Author with this slug already exists" };
      }
    }

    const updatedAuthor = await prisma.author.update({
      where: { id },
      data: validated,
    });

    revalidatePath(`/dashboard/blogs/${author.blogId}`);
    return { success: true, author: updatedAuthor };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to update author" };
  }
}

export async function deleteAuthor(id: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!author) {
      return { error: "Author not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      author.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    await prisma.author.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/blogs/${author.blogId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete author" };
  }
}

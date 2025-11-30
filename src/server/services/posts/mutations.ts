"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { OutputData } from "@editorjs/editorjs";
import { isValidLanguageCode } from "@/lib/languages";

const createPostSchema = z.object({
  blogId: z.string(),
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.any(), // Editor.js JSON
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.date().optional(),
  authorId: z.string().optional(),
  language: z.string().refine((val) => isValidLanguageCode(val), {
    message: "Invalid language code",
  }),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  canonicalUrl: z.string().optional(),
  keywords: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

const updatePostSchema = createPostSchema.partial().extend({
  blogId: z.string(),
});

export async function createPost(data: {
  blogId: string;
  title: string;
  slug: string;
  content: OutputData;
  excerpt?: string;
  coverImage?: string;
  status?: "draft" | "published";
  publishedAt?: Date;
  authorId?: string;
  language: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonicalUrl?: string;
  keywords?: string;
  categoryIds?: string[];
  tagIds?: string[];
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify blog ownership
    const blog = await prisma.blog.findUnique({
      where: { id: data.blogId },
    });

    if (!blog || blog.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const validated = createPostSchema.parse(data);

    // Check if slug already exists for this blog
    const existingPost = await prisma.post.findUnique({
      where: {
        blogId_slug: {
          blogId: data.blogId,
          slug: validated.slug,
        },
      },
    });

    if (existingPost) {
      return { error: "Post with this slug already exists" };
    }

    const post = await prisma.post.create({
      data: {
        blogId: validated.blogId,
        title: validated.title,
        slug: validated.slug,
        content: validated.content,
        excerpt: validated.excerpt,
        coverImage: validated.coverImage,
        status: validated.status,
        publishedAt: validated.publishedAt,
        authorId: validated.authorId,
        language: validated.language,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        ogImage: validated.ogImage,
        ogTitle: validated.ogTitle,
        ogDescription: validated.ogDescription,
        canonicalUrl: validated.canonicalUrl,
        keywords: validated.keywords,
        categories: validated.categoryIds
          ? {
              create: validated.categoryIds.map((categoryId) => ({
                categoryId,
              })),
            }
          : undefined,
        tags: validated.tagIds
          ? {
              create: validated.tagIds.map((tagId) => ({
                tagId,
              })),
            }
          : undefined,
      },
    });

    revalidatePath(`/dashboard/blogs/${data.blogId}`);
    return { success: true, post };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to create post" };
  }
}

export async function updatePost(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: OutputData;
    excerpt?: string;
    coverImage?: string;
    status?: "draft" | "published";
    publishedAt?: Date;
    authorId?: string;
    language?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    canonicalUrl?: string;
    keywords?: string;
    categoryIds?: string[];
    tagIds?: string[];
  }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!post || post.blog.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const validated = updatePostSchema.partial().parse({
      blogId: post.blogId,
      ...data,
    });

    // Validate language code if provided
    if (validated.language && !isValidLanguageCode(validated.language)) {
      return { error: "Invalid language code" };
    }

    // Check slug uniqueness if updating slug
    if (validated.slug && validated.slug !== post.slug) {
      const existingPost = await prisma.post.findUnique({
        where: {
          blogId_slug: {
            blogId: post.blogId,
            slug: validated.slug,
          },
        },
      });

      if (existingPost) {
        return { error: "Post with this slug already exists" };
      }
    }

    // Handle categories and tags updates
    if (validated.categoryIds !== undefined) {
      await prisma.postCategory.deleteMany({
        where: { postId: id },
      });
    }

    if (validated.tagIds !== undefined) {
      await prisma.postTag.deleteMany({
        where: { postId: id },
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        content: validated.content,
        excerpt: validated.excerpt,
        coverImage: validated.coverImage,
        status: validated.status,
        publishedAt:
          validated.status === "published" && !post.publishedAt
            ? validated.publishedAt || new Date()
            : validated.publishedAt,
        authorId: validated.authorId,
        language: validated.language,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        ogImage: validated.ogImage,
        ogTitle: validated.ogTitle,
        ogDescription: validated.ogDescription,
        canonicalUrl: validated.canonicalUrl,
        keywords: validated.keywords,
        categories:
          validated.categoryIds !== undefined
            ? {
                create: validated.categoryIds.map((categoryId) => ({
                  categoryId,
                })),
              }
            : undefined,
        tags:
          validated.tagIds !== undefined
            ? {
                create: validated.tagIds.map((tagId) => ({
                  tagId,
                })),
              }
            : undefined,
      },
    });

    revalidatePath(`/dashboard/blogs/${post.blogId}`);
    revalidatePath(`/dashboard/blogs/${post.blogId}/posts/${id}`);
    return { success: true, post: updatedPost };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message };
    }
    return { error: "Failed to update post" };
  }
}

export async function deletePost(id: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        blog: true,
      },
    });

    if (!post || post.blog.userId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await prisma.post.delete({
      where: { id },
    });

    revalidatePath(`/dashboard/blogs/${post.blogId}`);
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete post" };
  }
}


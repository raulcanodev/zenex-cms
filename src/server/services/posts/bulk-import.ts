"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";
import { v4 as uuidv4 } from "uuid";

const importPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.object({}).passthrough(), // EditorJS format
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().default(false),
  publishedAt: z.string().optional(), // ISO date string
  language: z.string().default("en"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
});

export async function importPostsInBulk(data: {
  blogId: string;
  posts: Array<{
    title: string;
    slug: string;
    content: Record<string, unknown>;
    excerpt?: string;
    coverImage?: string;
    status?: "draft" | "published";
    featured?: boolean;
    publishedAt?: string;
    language?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
  }>;
  fieldMapping: Record<string, string>; // Maps frontmatter fields to our schema
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

    const results = {
      success: [] as string[],
      errors: [] as { title: string; error: string }[],
    };

    // Import posts
    for (const postData of data.posts) {
      try {
        // Validate post data
        const validated = importPostSchema.parse(postData);

        // Check if slug already exists
        const existingPost = await prisma.post.findUnique({
          where: {
            blogId_slug_language: {
              blogId: data.blogId,
              slug: validated.slug,
              language: validated.language,
            },
          },
        });

        if (existingPost) {
          results.errors.push({
            title: validated.title,
            error: `Post with slug "${validated.slug}" already exists`,
          });
          continue;
        }

        // Create post
        await prisma.post.create({
          data: {
            blogId: data.blogId,
            title: validated.title,
            slug: validated.slug,
            content: validated.content as Prisma.InputJsonValue,
            excerpt: validated.excerpt,
            coverImage: validated.coverImage,
            status: validated.status,
            featured: validated.featured,
            publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : null,
            language: validated.language,
            translationGroupId: uuidv4(),
            metaTitle: validated.metaTitle,
            metaDescription: validated.metaDescription,
            keywords: validated.keywords,
          },
        });

        results.success.push(validated.title);
      } catch (error) {
        results.errors.push({
          title: postData.title || "Unknown",
          error: error instanceof Error ? error.message : "Failed to import post",
        });
      }
    }

    revalidatePath(`/dashboard/blogs/${data.blogId}`);
    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to import posts",
    };
  }
}

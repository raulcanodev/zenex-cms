"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { OutputData } from "@editorjs/editorjs";
import { isValidLanguageCode } from "@/lib/languages";
import { v4 as uuidv4 } from "uuid";
import { TranslationService } from "@/src/server/services/translations/TranslationService";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";

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
    // Verify blog access (owner or member)
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

    const validated = createPostSchema.parse(data);

    // Check if slug already exists for this blog and language
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
      return { error: "Post with this slug already exists in this language" };
    }

    // Generate translationGroupId if not provided (for new posts)
    const translationGroupId = uuidv4();

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
        translationGroupId,
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

    if (!post) {
      return { error: "Post not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      post.blogId
    );

    if (!hasAccess) {
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

    // Check slug uniqueness if updating slug or language
    const newSlug = validated.slug || post.slug;
    const newLanguage = validated.language || post.language;
    
    if ((validated.slug && validated.slug !== post.slug) || (validated.language && validated.language !== post.language)) {
      const existingPost = await prisma.post.findUnique({
        where: {
          blogId_slug_language: {
            blogId: post.blogId,
            slug: newSlug,
            language: newLanguage,
          },
        },
      });

      if (existingPost && existingPost.id !== id) {
        return { error: "Post with this slug already exists in this language" };
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

    if (!post) {
      return { error: "Post not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      post.blogId
    );

    if (!hasAccess) {
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

export async function translatePost(postId: string, targetLanguage: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get the original post
    const originalPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        blog: true,
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

    if (!originalPost) {
      return { error: "Post not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      originalPost.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    // Validate target language
    if (!isValidLanguageCode(targetLanguage)) {
      return { error: "Invalid target language code" };
    }

    // Check if target language is the same as source
    if (originalPost.language === targetLanguage) {
      return { error: "Target language must be different from source language" };
    }

    // Check if translation already exists
    const existingTranslation = await prisma.post.findFirst({
      where: {
        translationGroupId: originalPost.translationGroupId,
        language: targetLanguage,
      },
    });

    if (existingTranslation) {
      return { error: "Translation in this language already exists", post: existingTranslation };
    }

    // Initialize translation service
    const translationService = new TranslationService();

    // Translate content
    const translatedContent = await translationService.translatePostContent(
      originalPost.content as OutputData,
      targetLanguage,
      originalPost.language
    );

    // Translate text fields
    const translatedTitle = await translationService.translateText(
      originalPost.title,
      targetLanguage,
      originalPost.language
    );

    const translatedExcerpt = originalPost.excerpt
      ? await translationService.translateText(
          originalPost.excerpt,
          targetLanguage,
          originalPost.language
        )
      : null;

    const translatedMetaTitle = originalPost.metaTitle
      ? await translationService.translateText(
          originalPost.metaTitle,
          targetLanguage,
          originalPost.language
        )
      : null;

    const translatedMetaDescription = originalPost.metaDescription
      ? await translationService.translateText(
          originalPost.metaDescription,
          targetLanguage,
          originalPost.language
        )
      : null;

    const translatedOgTitle = originalPost.ogTitle
      ? await translationService.translateText(
          originalPost.ogTitle,
          targetLanguage,
          originalPost.language
        )
      : null;

    const translatedOgDescription = originalPost.ogDescription
      ? await translationService.translateText(
          originalPost.ogDescription,
          targetLanguage,
          originalPost.language
        )
      : null;

    const translatedKeywords = originalPost.keywords
      ? await translationService.translateText(
          originalPost.keywords,
          targetLanguage,
          originalPost.language
        )
      : null;

    // Use the same translationGroupId as the original post
    const translationGroupId = originalPost.translationGroupId || uuidv4();

    // Create the translated post
    const translatedPost = await prisma.post.create({
      data: {
        blogId: originalPost.blogId,
        title: translatedTitle,
        slug: originalPost.slug, // Same slug, different language
        content: translatedContent,
        excerpt: translatedExcerpt,
        coverImage: originalPost.coverImage, // Keep same image
        status: originalPost.status,
        publishedAt: originalPost.publishedAt,
        authorId: originalPost.authorId,
        language: targetLanguage,
        translationGroupId,
        metaTitle: translatedMetaTitle,
        metaDescription: translatedMetaDescription,
        ogImage: originalPost.ogImage, // Keep same OG image
        ogTitle: translatedOgTitle,
        ogDescription: translatedOgDescription,
        canonicalUrl: originalPost.canonicalUrl,
        keywords: translatedKeywords,
        // Copy categories and tags
        categories: originalPost.categories.length > 0
          ? {
              create: originalPost.categories.map((pc) => ({
                categoryId: pc.categoryId,
              })),
            }
          : undefined,
        tags: originalPost.tags.length > 0
          ? {
              create: originalPost.tags.map((pt) => ({
                tagId: pt.tagId,
              })),
            }
          : undefined,
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

    // If original post didn't have translationGroupId, update it
    if (!originalPost.translationGroupId) {
      await prisma.post.update({
        where: { id: postId },
        data: { translationGroupId },
      });
    }

    revalidatePath(`/dashboard/blogs/${originalPost.blogId}`);
    return { success: true, post: translatedPost };
  } catch (error) {
    console.error("Error translating post:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to translate post" };
  }
}

export async function syncPostTranslations(postId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get the current post with all its data
    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        blog: true,
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

    if (!currentPost) {
      return { error: "Post not found" };
    }

    const hasAccess = await userHasAccessToBlog(
      session.user.id,
      session.user.email || "",
      currentPost.blogId
    );

    if (!hasAccess) {
      return { error: "Unauthorized" };
    }

    // Check if post has a translation group
    if (!currentPost.translationGroupId) {
      return { error: "This post does not have any translations to sync" };
    }

    // Get all translations of the same group (excluding current post)
    const translations = await prisma.post.findMany({
      where: {
        translationGroupId: currentPost.translationGroupId,
        id: { not: postId },
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

    if (translations.length === 0) {
      return { error: "No translations found to sync" };
    }

    // Initialize translation service
    const translationService = new TranslationService();

    // Sync each translation (with error handling per translation)
    const syncResults = await Promise.allSettled(
      translations.map(async (translation) => {
        try {
          // Translate the content from current post to the translation's language
          const translatedContent = await translationService.translatePostContent(
            currentPost.content as OutputData,
            translation.language,
            currentPost.language
          );

          // Get current categories and tags IDs
          const currentCategoryIds = currentPost.categories.map((c) => c.categoryId);
          const currentTagIds = currentPost.tags.map((t) => t.tagId);

          // Get translation's current categories and tags IDs
          const translationCategoryIds = translation.categories.map((c) => c.categoryId);
          const translationTagIds = translation.tags.map((t) => t.tagId);

          // Determine which categories and tags to sync
          const categoriesToAdd = currentCategoryIds.filter(
            (id) => !translationCategoryIds.includes(id)
          );
          const categoriesToRemove = translationCategoryIds.filter(
            (id) => !currentCategoryIds.includes(id)
          );
          const tagsToAdd = currentTagIds.filter((id) => !translationTagIds.includes(id));
          const tagsToRemove = translationTagIds.filter((id) => !currentTagIds.includes(id));

          // Update the translation
          const updatedPost = await prisma.post.update({
            where: { id: translation.id },
            data: {
              content: translatedContent,
              // Sync non-language-specific fields
              coverImage: currentPost.coverImage,
              ogImage: currentPost.ogImage,
              canonicalUrl: currentPost.canonicalUrl,
              status: currentPost.status,
              authorId: currentPost.authorId,
              publishedAt: currentPost.publishedAt,
              // Sync categories
              categories: {
                deleteMany: categoriesToRemove.map((categoryId) => ({
                  postId: translation.id,
                  categoryId,
                })),
                create: categoriesToAdd.map((categoryId) => ({
                  categoryId,
                })),
              },
              // Sync tags
              tags: {
                deleteMany: tagsToRemove.map((tagId) => ({
                  postId: translation.id,
                  tagId,
                })),
                create: tagsToAdd.map((tagId) => ({
                  tagId,
                })),
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

          return { success: true, post: updatedPost, language: translation.language };
        } catch (error) {
          console.error(`Error syncing translation to ${translation.language}:`, error);
          return {
            success: false,
            language: translation.language,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Separate successful and failed syncs
    const syncedPosts = syncResults
      .filter((result) => result.status === "fulfilled" && result.value.success)
      .map((result) => (result.status === "fulfilled" ? result.value.post : null))
      .filter(Boolean);

    const failedSyncs = syncResults
      .filter(
        (result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success)
      )
      .map((result) => {
        if (result.status === "rejected") {
          return { language: "unknown", error: result.reason?.message || "Unknown error" };
        }
        return result.value;
      });

    // If all syncs failed, return error
    if (syncedPosts.length === 0 && failedSyncs.length > 0) {
      const errorMessages = failedSyncs
        .map((f) => `${f.language}: ${f.error}`)
        .join("; ");
      return { error: `Failed to sync translations: ${errorMessages}` };
    }

    // If some syncs failed, include warning in response
    const warnings =
      failedSyncs.length > 0
        ? failedSyncs.map((f) => `Failed to sync ${f.language}: ${f.error}`).join("; ")
        : undefined;

    revalidatePath(`/dashboard/blogs/${currentPost.blogId}`);
    return {
      success: true,
      syncedCount: syncedPosts.length,
      totalCount: translations.length,
      posts: syncedPosts,
      warnings,
    };
  } catch (error) {
    console.error("Error syncing post translations:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to sync post translations" };
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getPostsByBlogId, getPublishedLanguagesByGroup } from "@/src/server/services/posts/queries";
import { publicPostsQuery } from "@/lib/public-api";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";

// Cache the GET response for 60 seconds, revalidate in background
export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = publicPostsQuery.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { page, limit, status, category: categoryId, tag: tagId, language, orderBy, order, includeContent } = parsed.data;

    // Verify blog exists
    const blog = await getBlogByBlogId(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const { posts, pagination } = await getPostsByBlogId(blog.id, {
      page,
      limit,
      status,
      categoryId,
      tagId,
      includeContent,
      language,
      orderBy,
      order,
    });

    const languagesByGroup = await getPublishedLanguagesByGroup(
      blog.id, posts.flatMap(post => post.translationGroupId ? [post.translationGroupId] : [])
    );
    const formattedPosts = posts.map((post) => {
        const availableLanguages = post.translationGroupId
          ? languagesByGroup[post.translationGroupId] || [post.language]
          : [post.language];
        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          ...(includeContent ? {
            content: post.content,
            html: convertBlocksToHtml(post.content),
          } : {}),
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          language: post.language,
          featured: post.featured,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          categories: post.categories.map((pc) => ({
            id: pc.category.id,
            name: pc.category.name,
            slug: pc.category.slug,
          })),
          tags: post.tags.map((pt) => ({
            id: pt.tag.id,
            name: pt.tag.name,
            slug: pt.tag.slug,
          })),
          // SEO fields
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          ogImage: post.ogImage,
          ogTitle: post.ogTitle,
          ogDescription: post.ogDescription,
          canonicalUrl: post.canonicalUrl,
          keywords: post.keywords,
          availableLanguages,
        };
      });

    return NextResponse.json({
      data: formattedPosts,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


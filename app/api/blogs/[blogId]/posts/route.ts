import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getPostsByBlogId } from "@/src/server/services/posts/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;
    const { searchParams } = new URL(request.url);

    // Verify blog exists
    const blog = await getBlogByBlogId(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "published";
    const categoryId = searchParams.get("category") || undefined;
    const languageParam = searchParams.get("language");
    const language = languageParam && languageParam.trim() ? languageParam : undefined;

    const { posts, pagination } = await getPostsByBlogId(blog.id, {
      page,
      limit,
      status,
      categoryId,
      language,
    });

    // Format response for API
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      language: post.language,
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
    }));

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


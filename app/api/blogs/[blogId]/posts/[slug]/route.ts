import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getPostBySlug, getPostBySlugAndLanguage, getAvailableLanguagesBySlug } from "@/src/server/services/posts/queries";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string; slug: string }> }
) {
  try {
    const { blogId, slug } = await params;
    const { searchParams } = new URL(request.url);
    const languageParam = searchParams.get("language");

    // Verify blog exists
    const blog = await getBlogByBlogId(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Get post by language if specified, otherwise get default
    let post;
    if (languageParam && languageParam.trim()) {
      post = await getPostBySlugAndLanguage(blog.id, slug, languageParam);
    } else {
      post = await getPostBySlug(blog.id, slug);
    }

    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get available languages for this post
    const availableLanguages = await getAvailableLanguagesBySlug(blog.id, slug);

    // Format response for API
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      html: convertBlocksToHtml((post.content as any)?.blocks), // Added html field
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      language: post.language,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      categories: post.categories?.map((pc: any) => ({
        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })) || [],
      tags: post.tags?.map((pt: any) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })) || [],
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

    return NextResponse.json({
      data: formattedPost,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


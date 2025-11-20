import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getPostBySlug } from "@/src/server/services/posts/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string; slug: string }> }
) {
  try {
    const { blogId, slug } = await params;

    // Verify blog exists
    const blog = await getBlogByBlogId(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const post = await getPostBySlug(blog.id, slug);
    if (!post || post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Format response for API
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
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


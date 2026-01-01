import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getTagsByBlogIdCached } from "@/src/server/services/tags/queries";
// Cache the GET response for 1 hour (tags change infrequently)
export const revalidate = 3600;
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const { blogId } = await params;

    // Verify blog exists
    const blog = await getBlogByBlogId(blogId);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const tags = await getTagsByBlogIdCached(blog.id);

    // Format response for API
    const formattedTags = tags.map((tag: { id: string; name: string; slug: string; createdAt: Date; updatedAt: Date }) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    }));

    return NextResponse.json({
      data: formattedTags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


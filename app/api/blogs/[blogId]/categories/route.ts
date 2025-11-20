import { NextRequest, NextResponse } from "next/server";
import { getBlogByBlogId } from "@/src/server/services/blogs/queries";
import { getCategoriesByBlogIdCached } from "@/src/server/services/categories/queries";

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

    const categories = await getCategoriesByBlogIdCached(blog.id);

    // Format response for API
    const formattedCategories = categories.map((category: { id: string; name: string; slug: string; description: string | null; createdAt: Date; updatedAt: Date }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json({
      data: formattedCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


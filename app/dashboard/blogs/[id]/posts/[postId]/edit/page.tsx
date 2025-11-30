import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { getPostById } from "@/src/server/services/posts/queries";
import { getCategoriesByBlogId } from "@/src/server/services/categories/queries";
import { getTagsByBlogId } from "@/src/server/services/tags/queries";
import { getAuthorsByBlogId } from "@/src/server/services/authors/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { PostForm } from "@/components/PostForm/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const session = await getSession();
  const { id, postId } = await params;
  const blog = await getBlogById(id);
  const post = await getPostById(postId);

  if (!blog || blog.userId !== session?.user?.id) {
    redirect("/dashboard");
  }

  if (!post || post.blogId !== id) {
    redirect(`/dashboard/blogs/${id}`);
  }

  const [categories, tags, authors] = await Promise.all([
    getCategoriesByBlogId(id),
    getTagsByBlogId(id),
    getAuthorsByBlogId(id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <PostForm
          blogId={id}
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content as any,
            excerpt: post.excerpt,
            coverImage: post.coverImage,
            status: post.status,
            publishedAt: post.publishedAt,
            authorId: post.authorId,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            ogImage: post.ogImage,
            ogTitle: post.ogTitle,
            ogDescription: post.ogDescription,
            canonicalUrl: post.canonicalUrl,
            keywords: post.keywords,
            language: post.language,
            categories: post.categories,
            tags: post.tags,
          }}
          categories={categories}
          tags={tags}
          authors={authors}
        />
      </main>
    </div>
  );
}


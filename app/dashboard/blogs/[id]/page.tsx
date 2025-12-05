import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";
import { getPostsByBlogId, getAvailableLanguagesBySlug } from "@/src/server/services/posts/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { PostCard } from "@/components/PostCard/PostCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function BlogPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const { status } = await searchParams;
  const blog = await getBlogById(id);

  if (!blog) {
    redirect("/dashboard");
  }

  const hasAccess = await userHasAccessToBlog(
    session?.user?.id || "",
    session?.user?.email || "",
    id
  );

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { posts, pagination } = await getPostsByBlogId(id, {
    status: status || undefined,
    page: 1,
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader currentBlog={{ name: blog.name }} />
      <BlogNavigation blogId={id} />
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Posts</h1>
          <Link href={`/dashboard/blogs/${id}/posts/new`}>
            <Button>+ New post</Button>
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {await Promise.all(
            posts.map(async (post) => {
              const availableLanguages = await getAvailableLanguagesBySlug(id, post.slug);
              return (
                <PostCard
                  key={post.id}
                  id={post.id}
                  blogId={id}
                  title={post.title}
                  publishedAt={post.publishedAt}
                  status={post.status}
                  coverImage={post.coverImage}
                  language={post.language}
                  availableLanguages={availableLanguages}
                />
              );
            })
          )}
        </div>
        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No posts yet. Create your first post to get started.</p>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {posts.length} posts
          </div>
        )}
      </main>
    </div>
  );
}


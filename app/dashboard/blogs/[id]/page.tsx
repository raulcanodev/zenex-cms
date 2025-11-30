import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { getPostsByBlogId } from "@/src/server/services/posts/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { PostCard } from "@/components/PostCard/PostCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function BlogPostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; status?: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const { sort = "createdAt", status } = await searchParams;
  const blog = await getBlogById(id);

  if (!blog || blog.userId !== session?.user?.id) {
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
        <div className="mb-6 flex items-center gap-4">
          <Select defaultValue={sort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Sorted by Created at</SelectItem>
              <SelectItem value="updatedAt">Sorted by Updated at</SelectItem>
              <SelectItem value="publishedAt">Sorted by Published at</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              blogId={id}
              title={post.title}
              publishedAt={post.publishedAt}
              status={post.status}
              coverImage={post.coverImage}
              language={post.language}
            />
          ))}
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


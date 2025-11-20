import { getSession } from "@/lib/get-session";
import { getBlogsByUserId } from "@/src/server/services/blogs/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogCard } from "@/components/BlogCard/BlogCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createBlog } from "@/src/server/services/blogs/mutations";
import { CreateBlogDialog } from "@/components/CreateBlogDialog/CreateBlogDialog";

export default async function DashboardPage() {
  const session = await getSession();
  const blogs = await getBlogsByUserId(session?.user?.id || "");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Blogs</h1>
          <CreateBlogDialog />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {blogs.map((blog) => (
            <BlogCard
              key={blog.id}
              id={blog.id}
              name={blog.name}
              description={blog.description}
              postCount={blog._count.posts}
            />
          ))}
        </div>
        {blogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No blogs yet. Create your first blog to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}


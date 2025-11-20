import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { getCategoriesByBlogId } from "@/src/server/services/categories/queries";
import { getTagsByBlogId } from "@/src/server/services/tags/queries";
import { getAuthorsByBlogId } from "@/src/server/services/authors/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { PostForm } from "@/components/PostForm/PostForm";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
  const blog = await getBlogById(id);

  if (!blog || blog.userId !== session?.user?.id) {
    redirect("/dashboard");
  }

  const [categories, tags, authors] = await Promise.all([
    getCategoriesByBlogId(id),
    getTagsByBlogId(id),
    getAuthorsByBlogId(id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <PostForm blogId={id} categories={categories} tags={tags} authors={authors} />
      </main>
    </div>
  );
}


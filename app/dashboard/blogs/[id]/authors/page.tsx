import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";
import { getAuthorsByBlogId } from "@/src/server/services/authors/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { CreateAuthorDialog } from "@/components/CreateAuthorDialog/CreateAuthorDialog";
import { AuthorsList } from "@/components/AuthorsList/AuthorsList";

export default async function BlogAuthorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;
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

  const authors = await getAuthorsByBlogId(id);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader currentBlog={{ name: blog.name }} />
      <BlogNavigation blogId={id} />
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Authors</h1>
          <CreateAuthorDialog blogId={id} />
        </div>
        <AuthorsList authors={authors} blogId={id} />
        {authors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No authors yet. Add your first author to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { BlogIdDisplay } from "@/components/BlogIdDisplay/BlogIdDisplay";

export default async function BlogSettingsPage({
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader currentBlog={{ name: blog.name }} />
      <BlogNavigation blogId={id} />
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <div className="max-w-2xl">
          <BlogIdDisplay blogId={blog.blogId} />
        </div>
      </main>
    </div>
  );
}


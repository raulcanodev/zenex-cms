import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { BlogIdDisplay } from "@/components/BlogIdDisplay/BlogIdDisplay";
import { BlogMembers } from "@/components/BlogMembers/BlogMembers";
import { getBlogMembers } from "@/src/server/services/blogs/members/queries";

export default async function BlogSettingsPage({
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

  const isOwner = blog.userId === session?.user?.id;

  // Get blog members
  const membersResult = await getBlogMembers(id);
  const members = membersResult.members || [];
  const ownerEmail = membersResult.ownerEmail || "";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader currentBlog={{ name: blog.name }} />
      <BlogNavigation blogId={id} />
      <main className="mx-auto w-full max-w-[800px] px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <div className="max-w-2xl space-y-8">
          <div>
            <BlogIdDisplay blogId={blog.blogId} />
          </div>
          <div>
            <BlogMembers
              blogId={id}
              members={members}
              ownerEmail={ownerEmail}
              isOwner={isOwner}
            />
          </div>
        </div>
      </main>
    </div>
  );
}


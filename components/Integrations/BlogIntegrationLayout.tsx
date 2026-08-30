import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";

export async function integrationBlog(id: string) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/");
  const email = session.user.email?.trim().toLowerCase();
  const blog = await prisma.blog.findFirst({ where: { id, OR: [
    { userId: session.user.id }, ...(email ? [{ members: { some: { userEmail: email } } }] : []),
  ] } });
  if (!blog) redirect("/dashboard");
  return { blog, isOwner: blog.userId === session.user.id };
}

export function BlogIntegrationLayout({ blog, title, description, children }: {
  blog: { id: string; name: string }; title: string; description: string; children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">
    <DashboardHeader currentBlog={{ name: blog.name }} />
    <BlogNavigation blogId={blog.id} />
    <main className="mx-auto w-full max-w-[1000px] px-6 py-12">
      <div className="mb-10 space-y-3"><h1 className="text-3xl font-bold">{title}</h1><p className="max-w-2xl text-muted-foreground">{description}</p></div>
      <div className="space-y-8">{children}</div>
    </main>
  </div>;
}

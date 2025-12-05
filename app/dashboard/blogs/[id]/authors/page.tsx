import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { getBlogById } from "@/src/server/services/blogs/queries";
import { userHasAccessToBlog } from "@/src/server/services/blogs/members/mutations";
import { getAuthorsByBlogId } from "@/src/server/services/authors/queries";
import { DashboardHeader } from "@/components/DashboardHeader/DashboardHeader";
import { BlogNavigation } from "@/components/BlogNavigation/BlogNavigation";
import { CreateAuthorDialog } from "@/components/CreateAuthorDialog/CreateAuthorDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        <div className="space-y-2">
          {authors.map((author) => (
            <Card key={author.id}>
              <CardContent className="flex items-center justify-between py-0 px-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{author.name}</h3>
                  <p className="text-sm text-muted-foreground">{author.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
        {authors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No authors yet. Add your first author to get started.</p>
          </div>
        )}
      </main>
    </div>
  );
}

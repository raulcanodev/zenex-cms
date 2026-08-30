import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { API_SCOPES } from "@/lib/integrations/scopes";
import { ApiError } from "@/lib/integrations/errors";
import type { OperationName, ContentResource } from "@/lib/integrations/catalog";
import { executeOperation } from "./service";
import { invalidateContent } from "./cache";

export async function dashboardOperation(blogId: string, name: OperationName, input: unknown) {
  const session = await getSession();
  if (!session?.user?.id) throw new ApiError(401, "Unauthorized");
  const email = session.user.email?.trim().toLowerCase();
  const blog = await prisma.blog.findFirst({ where: {
    id: blogId,
    OR: [{ userId: session.user.id }, ...(email && name !== "update_blog" ? [{ members: { some: { userEmail: email } } }] : [])],
  } });
  if (!blog) throw new ApiError(403, "Unauthorized");
  const principal = { blogId, publicBlogId: blog.blogId, keyId: "session", scopes: [...API_SCOPES] };
  const result = await executeOperation(principal, name, input);
  invalidateContent(principal, true);
  return result.data;
}

export async function recordBlogId(resource: ContentResource, id: string) {
  // Never mutate/read content here; resolve tenant before dashboard authorization.
  const args = { where: { id }, select: { blogId: true } };
  const record = resource === "posts" ? await prisma.post.findUnique(args)
    : resource === "categories" ? await prisma.category.findUnique(args)
      : resource === "tags" ? await prisma.tag.findUnique(args) : await prisma.author.findUnique(args);
  if (!record) throw new ApiError(404, "Record not found");
  return record.blogId;
}

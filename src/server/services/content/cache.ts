import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import type { ApiPrincipal } from "@/lib/integrations/auth";

export function invalidateContent(principal: Pick<ApiPrincipal, "blogId" | "publicBlogId">, serverAction = false) {
  for (const tag of [`blog-${principal.blogId}-posts`, `blog-${principal.blogId}-categories`, `blog-${principal.blogId}-tags`, `blog-${principal.publicBlogId}`]) {
    if (serverAction) updateTag(tag);
    else revalidateTag(tag, { expire: 0 });
  }
  revalidatePath(`/dashboard/blogs/${principal.blogId}`, "layout");
}

"use server";

import type { Author } from "@prisma/client";
import { dashboardOperation, recordBlogId } from "@/src/server/services/content/dashboard";
import { apiError } from "@/lib/integrations/errors";

export async function createAuthor(data: {
  blogId: string;
  name: string;
  email: string;
  slug: string;
  bio?: string;
  avatar?: string;
}) {
  try {
    const { blogId, ...fields } = data;
    const author = await dashboardOperation(blogId, "create_authors", fields) as Author;
    return { success: true, author };
  } catch (error) { return { error: apiError(error).error }; }
}

export async function updateAuthor(
  id: string,
  data: {
    name?: string;
    email?: string;
    slug?: string;
    bio?: string;
    avatar?: string;
  }
) {
  try {
    const author = await dashboardOperation(await recordBlogId("authors", id), "update_authors", { ...data, id }) as Author;
    return { success: true, author };
  } catch (error) { return { error: apiError(error).error }; }
}

export async function deleteAuthor(id: string) {
  try {
    await dashboardOperation(await recordBlogId("authors", id), "delete_authors", { id });
    return { success: true };
  } catch (error) { return { error: apiError(error).error }; }
}

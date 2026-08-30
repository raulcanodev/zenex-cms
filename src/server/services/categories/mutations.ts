"use server";

import type { Category } from "@prisma/client";
import { dashboardOperation, recordBlogId } from "@/src/server/services/content/dashboard";
import { apiError } from "@/lib/integrations/errors";

export async function createCategory(data: {
  blogId: string;
  name: string;
  slug: string;
  description?: string;
}) {
  try {
    const { blogId, ...fields } = data;
    const category = await dashboardOperation(blogId, "create_categories", fields) as Category;
    return { success: true, category };
  } catch (error) { return { error: apiError(error).error }; }
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
  }
) {
  try {
    const category = await dashboardOperation(await recordBlogId("categories", id), "update_categories", { ...data, id }) as Category;
    return { success: true, category };
  } catch (error) { return { error: apiError(error).error }; }
}

export async function deleteCategory(id: string) {
  try {
    await dashboardOperation(await recordBlogId("categories", id), "delete_categories", { id });
    return { success: true };
  } catch (error) { return { error: apiError(error).error }; }
}

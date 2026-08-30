"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { generateApiKey } from "@/lib/integrations/auth";
import { createKeySchema, idSchema } from "@/lib/integrations/schemas";
import { ApiError, apiError } from "@/lib/integrations/errors";
import { revalidatePath } from "next/cache";

async function requireOwner(blogId: string) {
  idSchema.parse(blogId);
  const session = await getSession();
  if (!session?.user?.id) throw new ApiError(401, "Sign in to manage API keys");
  const blog = await prisma.blog.findFirst({ where: { id: blogId, userId: session.user.id }, select: { id: true } });
  if (!blog) throw new ApiError(403, "Only the blog owner can manage API keys");
}

export async function listApiKeys(blogId: string) {
  await requireOwner(blogId);
  const keys = await prisma.apiKey.findMany({ where: { blogId }, orderBy: { createdAt: "desc" }, take: 100, select: {
    id: true, name: true, prefix: true, scopes: true, createdAt: true,
    expiresAt: true, revokedAt: true, lastUsedAt: true,
  } });
  return keys.map(key => ({ ...key, expired: key.expiresAt.getTime() <= Date.now() }));
}

export async function createApiKey(blogId: string, input: unknown) {
  try {
    await requireOwner(blogId);
    const data = createKeySchema.parse(input);
    const { token, tokenHash, prefix } = generateApiKey();
    const expiresAt = new Date(Date.now() + data.expiresInDays * 86_400_000);
    await prisma.$transaction(async tx => {
      // Serialize issuance per blog so concurrent requests cannot bypass the cap.
      await tx.$queryRaw`SELECT "id" FROM "Blog" WHERE "id" = ${blogId} FOR UPDATE`;
      const count = await tx.apiKey.count({ where: { blogId, revokedAt: null, expiresAt: { gt: new Date() } } });
      if (count >= 25) throw new ApiError(409, "Revoke an existing key before creating more (25 active keys maximum)");
      await tx.apiKey.create({ data: { blogId, name: data.name, scopes: data.scopes, tokenHash, prefix, expiresAt } });
    });
    revalidatePath(`/dashboard/blogs/${blogId}/api-keys`);
    return { token };
  } catch (error) { return { error: apiError(error).error }; }
}

export async function revokeApiKey(blogId: string, keyId: string) {
  try {
    await requireOwner(blogId);
    idSchema.parse(keyId);
    const result = await prisma.apiKey.updateMany({ where: { id: keyId, blogId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!result.count) throw new ApiError(404, "Active API key not found");
    revalidatePath(`/dashboard/blogs/${blogId}/api-keys`);
    return { success: true };
  } catch (error) { return { error: apiError(error).error }; }
}

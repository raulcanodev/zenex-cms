import { z } from "zod";

// Bound database work and reject invalid query fields before reaching Prisma.
const positiveInteger = (fallback: string, maximum: number) =>
  z.string().regex(/^[1-9]\d*$/).default(fallback).transform(Number)
    .pipe(z.number().int().min(1).max(maximum));

export const publicPostsQuery = z.object({
  page: positiveInteger("1", 10_000),
  limit: positiveInteger("10", 100),
  status: z.literal("published").default("published"),
  category: z.string().trim().min(1).max(128).optional(),
  tag: z.string().trim().min(1).max(128).optional(),
  language: z.string().trim().min(2).max(16).optional(),
  orderBy: z.enum(["publishedAt", "createdAt", "title"]).default("publishedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  // Existing consumers keep full responses; list views can skip bodies/rendering.
  includeContent: z.enum(["true", "false"]).default("true").transform(value => value === "true"),
});

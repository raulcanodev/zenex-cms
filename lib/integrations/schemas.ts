import { z } from "zod";
import { isValidLanguageCode } from "../languages";
import { API_SCOPES } from "./scopes";

export const idSchema = z.string().min(1).max(128);
const name = z.string().trim().min(1).max(300);
const slug = z.string().min(1).max(200).regex(/^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u, "Use a URL slug without spaces or slashes");
const text = z.string().max(10_000).nullable().optional();
const url = z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(2048)]).nullable().optional();
const ids = z.array(idSchema).max(100).refine(v => new Set(v).size === v.length, "Duplicate IDs").optional();

export const editorContentSchema = z.object({
  time: z.number().optional(),
  version: z.string().max(32).optional(),
  blocks: z.array(z.object({
    id: z.string().max(128).optional(),
    type: z.string().min(1).max(64),
    data: z.record(z.string(), z.json()),
    tunes: z.record(z.string(), z.json()).optional(),
  }).strict()).max(1000),
}).strict();

export const postCreateSchema = z.object({
  title: name, slug, content: editorContentSchema,
  language: z.string().refine(isValidLanguageCode, "Invalid language code").default("en"),
  status: z.enum(["draft", "published"]).default("draft"),
  featured: z.boolean().optional(),
  excerpt: text, coverImage: url, authorId: idSchema.nullable().optional(),
  publishedAt: z.iso.datetime({ offset: true }).nullable().optional(),
  translationGroupId: z.uuid().optional(),
  metaTitle: text, metaDescription: text, ogImage: url, ogTitle: text,
  ogDescription: text, canonicalUrl: url, keywords: text,
  categoryIds: ids, tagIds: ids,
}).strict();
const nonempty = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.refine(v => Object.keys(v).length > 0, "Provide at least one field");
// Override create defaults: a PATCH must never reset language or publication state.
export const postUpdateSchema = nonempty(postCreateSchema.partial().extend({
  language: z.string().refine(isValidLanguageCode, "Invalid language code").optional(),
  status: z.enum(["draft", "published"]).optional(),
}));
export const categorySchema = z.object({ name, slug, description: text }).strict();
export const tagSchema = z.object({ name, slug }).strict();
export const authorSchema = z.object({ name, slug, email: z.email().max(254), bio: text, avatar: url }).strict();
export const blogSchema = z.object({ name, slug, description: text }).strict();
export const categoryUpdateSchema = nonempty(categorySchema.partial());
export const tagUpdateSchema = nonempty(tagSchema.partial());
export const authorUpdateSchema = nonempty(authorSchema.partial());
export const blogUpdateSchema = nonempty(blogSchema.partial());
export const listSchema = z.object({
  page: z.number().int().min(1).max(10_000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).strict();
export const postListSchema = listSchema.extend({
  status: z.enum(["draft", "published", "all"]).default("all"),
  language: z.string().refine(isValidLanguageCode).optional(),
  categoryId: idSchema.optional(), tagId: idSchema.optional(),
  search: z.string().trim().min(1).max(200).optional(),
}).strict();
export const createKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  scopes: z.array(z.enum(API_SCOPES)).min(1).max(API_SCOPES.length)
    .refine(v => new Set(v).size === v.length, "Duplicate scopes"),
  expiresInDays: z.number().int().min(1).max(365).default(90),
}).strict();

export const imageUploadSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  base64: z.string().min(4).max(956_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, "Expected standard padded base64, without a data URL prefix"),
}).strict();

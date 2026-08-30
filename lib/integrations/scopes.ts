export const API_SCOPES = [
  "content:read", "content:write", "content:publish", "content:delete", "blog:write", "media:write",
] as const;
export type ApiScope = typeof API_SCOPES[number];

export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
  "content:read": "Read posts (including drafts), categories, tags, authors and blog details.",
  "content:write": "Create drafts and manage categories, tags and authors. Edit draft posts.",
  "content:publish": "Publish, unpublish or edit published posts (also requires content:write).",
  "content:delete": "Permanently delete content. Published posts also require content:publish.",
  "blog:write": "Update this blog’s name, slug and description. No account or member access.",
  "media:write": "Upload public images to this blog’s storage. Files are public even when used in drafts.",
};

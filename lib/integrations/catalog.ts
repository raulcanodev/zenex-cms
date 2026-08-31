import type { ApiScope } from "./scopes";

export const CONTENT_RESOURCES = ["posts", "categories", "tags", "authors"] as const;
export type ContentResource = typeof CONTENT_RESOURCES[number];
export type OperationName = `${"list" | "get" | "create" | "update" | "delete"}_${ContentResource}` | "get_blog" | "update_blog" | "upload_image";
export type Operation = { name: OperationName; method: string; path: string; scope: ApiScope; description: string };
export const OPERATIONS: Operation[] = [
  { name: "upload_image", method: "POST", path: "/media", scope: "media:write", description: "Upload a public JPEG, PNG, GIF or WebP image as base64 (maximum 700 KiB decoded). Returns a URL usable in coverImage or Editor.js. Do not upload confidential files; images are public even for drafts." },
  { name: "get_blog", method: "GET", path: "", scope: "content:read", description: "Read this blog’s public identifier and metadata." },
  { name: "update_blog", method: "PATCH", path: "", scope: "blog:write", description: "Update this blog’s name, slug or description. Cannot change ownership." },
  ...CONTENT_RESOURCES.flatMap(resource => ([
    { name: `list_${resource}`, method: "GET", path: `/${resource}`, scope: "content:read", description: `List ${resource}, paginated. Posts include drafts; results are private.` },
    { name: `get_${resource}`, method: "GET", path: `/${resource}/{id}`, scope: "content:read", description: `Read one ${resource} record by its internal ID, not its slug.` },
    { name: `create_${resource}`, method: "POST", path: `/${resource}`, scope: "content:write", description: `Create ${resource}. Posts default to draft; publishing additionally requires content:publish. Use Editor.js JSON for content.${resource === "posts" ? " Supports every dashboard block, including tables with header rows. MCP clients: call get_editor_guide for examples." : ""}` },
    { name: `update_${resource}`, method: "PATCH", path: `/${resource}/{id}`, scope: "content:write", description: `Update only supplied fields in ${resource}. Editing a published post or changing publication state additionally requires content:publish.${resource === "posts" ? " Supplied content replaces the entire document: call get_posts first and preserve untouched blocks. MCP clients: call get_editor_guide for block formats." : ""}` },
    { name: `delete_${resource}`, method: "DELETE", path: `/${resource}/{id}`, scope: "content:delete", description: `Permanently delete ${resource}. Published posts additionally require content:publish. Ask the user before deleting.` },
  ] as Operation[])),
];

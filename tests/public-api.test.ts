import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { publicPostsQuery } from "@/lib/public-api";

const mocks = vi.hoisted(() => ({ blog: vi.fn(), posts: vi.fn(), languages: vi.fn() }));
vi.mock("@/src/server/services/blogs/queries", () => ({ getBlogByBlogId: mocks.blog }));
vi.mock("@/src/server/services/posts/queries", () => ({ getPostsByBlogId: mocks.posts, getPublishedLanguagesByGroup: mocks.languages }));
import { GET } from "@/app/api/blogs/[blogId]/posts/route";

const request = (query = "") => GET(new NextRequest(`https://cms.example/api/blogs/test/posts?${query}`), { params: Promise.resolve({ blogId: "test" }) });

beforeEach(() => {
  mocks.blog.mockResolvedValue({ id: "internal-blog" });
  mocks.posts.mockResolvedValue({ posts: [{ id: "one", slug: "hello", title: "Hello", language: "en", translationGroupId: "group", content: { blocks: [{ type: "paragraph", data: { text: "Body" } }] }, categories: [], tags: [] }], pagination: { page: 1, total: 1 } });
  mocks.languages.mockResolvedValue({ group: ["en", "es"] });
});

describe("public posts API", () => {
  it.each(["status=draft", "status=all", "page=-1", "page=1oops", "page=10001", "limit=100000", "limit=0", "orderBy=password", "order=invalid"])("rejects %s before accessing data", async query => {
    expect((await request(query)).status).toBe(400);
    expect(mocks.blog).not.toHaveBeenCalled();
    expect(mocks.posts).not.toHaveBeenCalled();
  });
  it("defaults to published-only and preserves full content for existing clients", async () => {
    const response = await request();
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.posts).toHaveBeenCalledWith("internal-blog", expect.objectContaining({ status: "published", limit: 10 }));
    expect(json.data[0].html).toContain("Body");
    expect(json.data[0].availableLanguages).toEqual(["en", "es"]);
    expect(mocks.languages).toHaveBeenCalledTimes(1);
  });
  it("omits content and html on lightweight lists, and passes tag filters", async () => {
    const json = await (await request("includeContent=false&tag=javascript")).json();
    expect(json.data[0]).not.toHaveProperty("html");
    expect(json.data[0]).not.toHaveProperty("content");
    expect(mocks.posts).toHaveBeenCalledWith("internal-blog", expect.objectContaining({ tagId: "javascript" }));
  });
  it("returns 404 for an unknown blog", async () => {
    mocks.blog.mockResolvedValue(null);
    expect((await request()).status).toBe(404);
    expect(mocks.posts).not.toHaveBeenCalled();
  });
  it("accepts the largest supported page size", () => {
    expect(publicPostsQuery.parse({ limit: "100" }).limit).toBe(100);
  });
});

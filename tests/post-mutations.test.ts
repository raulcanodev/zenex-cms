import { beforeEach, describe, expect, it, vi } from "vitest";
import { postCreateSchema, postUpdateSchema } from "@/lib/integrations/schemas";
import { ApiError } from "@/lib/integrations/errors";

const mocks = vi.hoisted(() => ({ operation: vi.fn(), recordBlogId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/get-session", () => ({ getSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("@/src/server/services/content/dashboard", () => ({ dashboardOperation: mocks.operation, recordBlogId: mocks.recordBlogId }));
import { createPost, updatePost } from "@/src/server/services/posts/mutations";

describe("dashboard post payloads", () => {
  beforeEach(() => {
    mocks.recordBlogId.mockResolvedValue("actual-blog");
    mocks.operation.mockImplementation(async (_blogId, operation, input) => {
      if (operation === "create_posts") return { id: "post", ...postCreateSchema.parse(input) };
      const { id, ...fields } = input;
      return { id, ...postUpdateSchema.parse(fields) };
    });
  });

  it("accepts older edit forms without trusting their blogId or weakening validation", async () => {
    const input = { blogId: "different-blog", title: "Updated", publishedAt: new Date("2026-08-31T12:00:00Z") };
    const result = await updatePost("post", input);
    expect(result.error).toBeUndefined();
    expect(mocks.operation).toHaveBeenCalledWith("actual-blog", "update_posts", {
      id: "post", title: "Updated", publishedAt: "2026-08-31T12:00:00.000Z",
    });
    expect(input.blogId).toBe("different-blog");
    const invalidInput = { title: "Updated", unexpected: true };
    expect((await updatePost("post", invalidInput)).error).toContain('Unrecognized key: "unexpected"');
  });

  it("supports current edit forms and still propagates denied access", async () => {
    expect((await updatePost("post", { title: "Updated" })).error).toBeUndefined();
    mocks.operation.mockRejectedValueOnce(new ApiError(403, "Unauthorized"));
    expect((await updatePost("post", { title: "Denied", blogId: "different-blog" })).error).toBe("Unauthorized");
  });

  it("passes blogId only as the creation context and retains table data", async () => {
    const content = { blocks: [{ type: "table", data: { withHeadings: true, content: [["Heading"], ["Value"]] } }] };
    const result = await createPost({ blogId: "actual-blog", title: "New", slug: "new", language: "en", content });
    expect(result.error).toBeUndefined();
    expect(result.post?.content).toEqual(content);
    expect(mocks.operation.mock.calls[0][2]).not.toHaveProperty("blogId");
  });
});

import { expect, it, vi } from "vitest";
const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { post: { findMany } } }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn }));
import { getPublishedLanguagesByGroup } from "@/src/server/services/posts/queries";

it("batches translation lookups, scoped to the blog and published posts", async () => {
  findMany.mockResolvedValue([
    { translationGroupId: "g1", language: "en" },
    { translationGroupId: "g1", language: "es" },
    { translationGroupId: "g1", language: "es" },
    { translationGroupId: "g2", language: "pt" },
  ]);
  expect(await getPublishedLanguagesByGroup("blog", ["g2", "g1", "g1"])).toEqual({ g1: ["en", "es"], g2: ["pt"] });
  expect(findMany).toHaveBeenCalledTimes(1);
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { blogId: "blog", status: "published", translationGroupId: { in: ["g1", "g2"] } } }));
});
it("does not query translations when no groups exist", async () => {
  expect(await getPublishedLanguagesByGroup("blog", [])).toEqual({});
  expect(findMany).not.toHaveBeenCalled();
});

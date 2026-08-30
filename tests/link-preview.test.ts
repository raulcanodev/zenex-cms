import { expect, it, vi } from "vitest";
const lookup = vi.hoisted(() => vi.fn());
vi.mock("node:dns/promises", () => ({ lookup }));
import { isPublicAddress, resolvePublicUrl } from "@/lib/link-preview";

it.each(["127.0.0.2", "0.0.0.0", "10.1.2.3", "172.31.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1"])("blocks internal/reserved IP %s", address => {
  expect(isPublicAddress(address)).toBe(false);
});
it("rejects public hostnames that resolve to private IPs", async () => {
  lookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
  await expect(resolvePublicUrl("https://example.com")).rejects.toThrow("Private or reserved");
});
it("returns the validated IP for the actual socket connection", async () => {
  lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  const result = await resolvePublicUrl("https://example.com/article");
  expect(result.address.address).toBe("93.184.216.34");
  expect(result.hostname).toBe("example.com");
});
it.each(["file:///etc/passwd", "https://user:password@example.com", "http://example.com:4444"])("rejects unsupported URL %s", async url => {
  await expect(resolvePublicUrl(url)).rejects.toThrow();
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { Auth, customFetch, skipCSRFCheck, type AuthConfig } from "@auth/core";
import { githubProvider } from "@/lib/github-provider";

// Exercise Auth.js's actual authorization/callback flow without external accounts.
async function callback(issuer: string) {
  const network = vi.fn(async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("/access_token")) return Response.json({ access_token: "test-token", token_type: "bearer" });
    if (url === "https://api.github.com/user") return Response.json({ id: 1, login: "tester", name: "Test", email: "test@example.com" });
    throw new Error(`Unexpected OAuth request: ${url}`);
  });
  vi.stubGlobal("fetch", network);
  const errors = vi.fn();
  const config: AuthConfig = {
    secret: "only-for-local-tests-not-a-real-secret",
    trustHost: true,
    basePath: "/api/auth",
    skipCSRFCheck,
    providers: [{ ...githubProvider, options: { ...githubProvider.options, clientId: "test-client", clientSecret: "test-secret" }, [customFetch]: network }],
    logger: { error: errors, warn: vi.fn(), debug: vi.fn() },
  };
  const start = await Auth(new Request("https://cms.example/api/auth/signin/github", { method: "POST" }), config);
  const authorization = new URL(start.headers.get("location")!);
  const cookies = start.headers.getSetCookie().map(cookie => cookie.split(";")[0]).join("; ");
  const query = new URLSearchParams({ code: "test-code", iss: issuer });
  if (authorization.searchParams.has("state")) query.set("state", authorization.searchParams.get("state")!);
  const response = await Auth(new Request(`https://cms.example/api/auth/callback/github?${query}`, { headers: { cookie: cookies } }), config);
  return { response, errors, network };
}

afterEach(() => vi.unstubAllGlobals());
describe("GitHub OAuth issuer regression", () => {
  it("accepts GitHub's issuer and creates a session", async () => {
    const { response, errors } = await callback("https://github.com/login/oauth");
    expect(errors).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://cms.example");
    expect(response.headers.getSetCookie().join(";")).toContain("authjs.session-token=");
  });
  it("still rejects a different issuer before exchanging the code", async () => {
    const { response, errors, network } = await callback("https://attacker.example");
    expect(response.headers.get("location")).toContain("/api/auth/error");
    expect(errors).toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });
});

#!/usr/bin/env node
// Local stdio bridge: credentials stay in the client's environment. No database access.
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

export function connectionConfig(env) {
  const url = new URL(env.ZENEX_CMS_URL || "");
  if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) throw new Error("Use the CMS origin only, without credentials, paths or query parameters");
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) throw new Error("HTTPS is required except on localhost");
  if (!/^znx_[A-Za-z0-9_-]{43}$/.test(env.ZENEX_API_KEY || "")) throw new Error("Set ZENEX_API_KEY to a valid API key");
  return { url: new URL("/api/mcp", url), token: env.ZENEX_API_KEY };
}

export async function main() {
  const config = connectionConfig(process.env);
  const client = new Client({ name: "zenex-stdio-bridge", version: "1.0.0" });
  const remote = new StreamableHTTPClientTransport(config.url, {
    requestInit: { headers: { Authorization: `Bearer ${config.token}` } },
    fetch: (url, init) => fetch(url, { ...init, redirect: "error", signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000) }),
  });
  await client.connect(remote);
  // Dynamic proxy: tool names/schemas and authorization come from the remote server.
  const server = new Server({ name: "zenex-cms", version: "1.0.0" }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => client.listTools());
  server.setRequestHandler(CallToolRequestSchema, async request => {
    try { return await client.callTool(request.params); }
    catch { return { isError: true, content: [{ type: "text", text: "Zenex request failed. Check connectivity, API key expiry and permissions. Do not automatically retry mutations." }] }; }
  });
  const local = new StdioServerTransport();
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await Promise.allSettled([server.close(), client.close()]);
  };
  local.onclose = () => { void close(); };
  process.once("SIGINT", () => { void close(); });
  process.once("SIGTERM", () => { void close(); });
  process.stdin.once("end", () => { void close(); });
  await server.connect(local);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => {
    // Never print URLs with credentials, headers, server bodies or SDK error objects.
    console.error("Zenex MCP could not connect. Check ZENEX_CMS_URL, ZENEX_API_KEY and network access.");
    process.exitCode = 1;
  });
}

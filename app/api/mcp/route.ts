import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateApiKey } from "@/lib/integrations/auth";
import { checkOrigin, readJson, errorResponse, privateJson } from "@/lib/integrations/http";
import { createMcpServer } from "@/lib/integrations/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const principal = await authenticateApiKey(request);
    const body = await readJson(request);
    const server = createMcpServer(principal);
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    try {
      await server.connect(transport);
      const response = await transport.handleRequest(request, { parsedBody: body });
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("X-Content-Type-Options", "nosniff");
      return response;
    } finally { await server.close(); }
  } catch (error) { return errorResponse(error); }
}

// Stateless JSON transport: no unsolicited SSE stream or persistent sessions.
async function unsupported(request: Request) {
  try {
    checkOrigin(request);
    await authenticateApiKey(request);
    const response = privateJson({ error: "No persistent sessions or SSE stream; use POST" }, 405);
    response.headers.set("Allow", "POST");
    return response;
  } catch (error) { return errorResponse(error); }
}
export { unsupported as GET, unsupported as DELETE };

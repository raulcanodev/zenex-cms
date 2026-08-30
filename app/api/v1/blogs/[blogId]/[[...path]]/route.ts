import { authenticateApiKey } from "@/lib/integrations/auth";
import { OPERATIONS } from "@/lib/integrations/catalog";
import { ApiError } from "@/lib/integrations/errors";
import { checkOrigin, errorResponse, privateJson, readJson } from "@/lib/integrations/http";
import { executeOperation } from "@/src/server/services/content/service";
import { invalidateContent } from "@/src/server/services/content/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ blogId: string; path?: string[] }> };

async function handle(request: Request, { params }: Context) {
  try {
    checkOrigin(request);
    const { blogId, path = [] } = await params;
    const principal = await authenticateApiKey(request, blogId);
    const template = path.length === 0 ? "" : path.length === 1 ? `/${path[0]}` : path.length === 2 ? `/${path[0]}/{id}` : null;
    const operation = OPERATIONS.find(o => o.path === template && o.method === request.method);
    if (!operation) throw new ApiError(404, "Unknown endpoint or method");
    let input: Record<string, unknown> = {};
    if (request.method === "GET") {
      input = Object.fromEntries(new URL(request.url).searchParams);
      for (const field of ["page", "limit"]) {
        if (field in input) input[field] = /^\d+$/.test(String(input[field])) ? Number(input[field]) : NaN;
      }
    } else if (request.method !== "DELETE") {
      const body = await readJson(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "Expected a JSON object");
      input = body as Record<string, unknown>;
      if ("id" in input) throw new ApiError(400, "Pass the record ID in the URL, not in the body");
    }
    if (path.length === 2) input.id = path[1];
    const result = await executeOperation(principal, operation.name, input);
    if (request.method !== "GET") invalidateContent(principal);
    return privateJson(result, request.method === "POST" ? 201 : 200);
  } catch (error) { return errorResponse(error); }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };

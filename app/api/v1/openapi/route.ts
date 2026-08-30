import { managementOpenApi } from "@/lib/integrations/openapi";

export function GET() { return Response.json(managementOpenApi()); }

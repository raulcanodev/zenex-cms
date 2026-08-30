import { z } from "zod";
import { OPERATIONS } from "./catalog";
import { operationSchemas } from "@/src/server/services/content/service";

export function managementOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of OPERATIONS) {
    const path = `/api/v1/blogs/{blogId}${operation.path}`;
    const schema = z.toJSONSchema(operationSchemas[operation.name], { io: "input" });
    const { $schema: ignored, ...input } = schema;
    void ignored;
    const properties = { ...input.properties };
    delete properties.id;
    const bodySchema = { ...input, properties, ...(input.required ? { required: input.required.filter((field: string) => field !== "id") } : {}) };
    const parameters: unknown[] = [{ name: "blogId", in: "path", required: true, schema: { type: "string" }, description: "Public Blog ID (UUID), not a key" }];
    if (operation.path.includes("{id}")) parameters.push({ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Internal record ID, not slug" });
    if (operation.method === "GET") for (const [name, field] of Object.entries(properties)) parameters.push({ name, in: "query", required: false, schema: field });
    paths[path] ??= {};
    paths[path][operation.method.toLowerCase()] = {
      operationId: operation.name, description: `${operation.description} Required scope: ${operation.scope}.`,
      security: [{ bearerAuth: [] }], parameters,
      ...(["POST", "PATCH"].includes(operation.method) ? { requestBody: { required: true, content: { "application/json": { schema: bodySchema } } } } : {}),
      responses: Object.fromEntries([
        [operation.method === "POST" ? "201" : "200", "Success: data (and pagination on lists)"],
        ["400", "Invalid input"], ["401", "Invalid, missing, expired or revoked API key"],
        ["403", "Insufficient scope or wrong blog/origin"], ["404", "Record not found"],
        ["409", "Duplicate slug/email"], ["413", "Body too large"], ["415", "Expected JSON"],
        ["429", "Rate limit exceeded; Retry-After: 60"], ["500", "Internal server error"], ["503", "Media storage not configured"],
      ].map(([status, description]) => [status, { description }])),
    };
  }
  return { openapi: "3.1.0", info: { title: "Zenex CMS Management API", version: "1.0.0" }, paths, components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "Zenex API key" } },
  } };
}

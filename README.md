# Zenex CMS

A multilingual headless CMS built with Next.js 16, React 19, Prisma 6, PostgreSQL and Editor.js. Inspired by [Zenblog](https://www.zenblog.com/); this is an independent codebase.

## Features

- Multiple blogs, owner/member collaboration, authors, categories and tags.
- Editor.js content, drafts/publication, SEO fields and linked translations.
- Optional OpenAI-powered translation and S3-compatible Cloudflare R2 image storage.
- Public published-content API and a separate private management API.
- MCP via Streamable HTTP and a local stdio bridge, sharing the private API’s operations and permissions.
- Owner-managed, expiring and revocable API keys; secrets displayed once and stored only as hashes.

## Local setup

Use **Node.js 24.x** (see .nvmrc) and PostgreSQL.

```bash
npm ci
cp .env.example .env
# Configure DATABASE_URL, NEXTAUTH_URL and NEXTAUTH_SECRET in .env.
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open [localhost:4444](http://localhost:4444). Register or sign in, create a blog, then use its navigation: Posts, Authors, Categories, Settings, MCP and API keys.

Generate an authentication secret with `openssl rand -base64 32`. Do not commit .env files. GitHub OAuth is optional; configure its client credentials and callback URL at `https://your-cms.example/api/auth/callback/github`. Set the canonical authentication URL and trusted proxy/host settings correctly for your deployment. See [.env.example](.env.example) for the exact environment names used by the code.

Optional integrations:

- AI translation: `OPENAI_API_KEY`.
- Image storage: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`. Use a bucket-scoped storage token and a public media origin separate from the CMS. The configured public media URL serves uploaded images without authentication, including images used in drafts.

## APIs: public delivery versus private editing

The **Blog ID in Settings is a public UUID, not an API key**.

Public, unauthenticated delivery:

```text
GET /api/blogs/{blogId}/posts
GET /api/blogs/{blogId}/posts/{slug}?language=en
GET /api/blogs/{blogId}/categories
GET /api/blogs/{blogId}/tags
```

Public posts are always published-only. Asking for `status=draft` or `status=all` returns 400. Post lists accept page, limit (1–100), language, category/tag IDs, orderBy, order and includeContent. Use `includeContent=false` for lightweight lists; paginate until totalPages when loading a complete archive. Public responses include sanitized HTML when content is included. Categories and tags are public metadata even when not used in published posts.

Private editorial API:

```text
Base: /api/v1/blogs/{blogId}
Authorization: Bearer <key>
Content-Type: application/json

GET, PATCH                  (base path)
GET, POST                   /posts, /categories, /tags, /authors
GET, PATCH, DELETE          /posts/{id}, /categories/{id}, /tags/{id}, /authors/{id}
POST                       /media
GET /api/v1/openapi         (public schema; no credentials required)
```

Private item paths use **record IDs**, not slugs. Lists are paginated; private posts include drafts. JSON bodies are bounded to 1 MiB. Images use base64, with a decoded limit of 700 KiB (JPEG/PNG/GIF/WebP). The existing dashboard multipart upload retains its 10 MiB image limit and checks blog access.

Create keys in **Blog → API keys** (owner only). The default selection is `content:read` + `content:write` for drafting. Additional scopes: `content:publish`, `content:delete`, `blog:write`, `media:write`.

Publication and editing already-published posts require write + publish. Deleting published posts requires delete + publish. Taxonomy/author edits can affect public posts, so content:write is for trusted editors. Keys cannot manage accounts, create/delete blogs, change members/owners, mint keys or invoke paid automatic translation. Agents can write their own translations using linked posts.

See the running app’s **/docs/api/management** for fields, examples, errors and limits, **/docs/mcp** for client setup, and **/api/v1/openapi** for the generated OpenAPI 3.1 contract.

## Connect an MCP client

Remote endpoint: `https://your-cms.example/api/mcp`, transport **Streamable HTTP**, header `Authorization: Bearer <key>`.

For a local stdio client, install this checkout’s dependencies, then configure:

```json
{
  "mcpServers": {
    "zenex": {
      "command": "node",
      "args": ["/absolute/path/to/zenex-cms/scripts/mcp-stdio.mjs"],
      "env": {
        "ZENEX_CMS_URL": "https://your-cms.example",
        "ZENEX_API_KEY": "znx_REPLACE_WITH_YOUR_KEY"
      }
    }
  }
}
```

This is a generic mcpServers JSON example; use your client’s equivalent command/args/env fields if its format differs. Use its secret store when supported. The local bridge needs no database connection or CMS .env file. It only forwards tool discovery and calls to the authenticated remote server. Run the script directly with node so package-manager banners do not corrupt stdout.

Compatibility: stdio and stateless Streamable HTTP JSON. **No OAuth or legacy SSE**. Remote clients must support custom authorization headers; OAuth-only remote clients need the stdio bridge if local servers are supported. HTTPS is mandatory for the bridge except localhost. Redirects are rejected to prevent credential forwarding.

## Security and operations

- API keys contain 256 random bits, are stored as SHA-256 hashes, and expire in 1–365 days (90 by default), unless the owner enables Never expires. Up to 25 active keys per blog.
- Only owners can list/create/revoke keys; members cannot escalate their permissions through key management. No key has account-wide access.
- Revocation/expiry are checked on every HTTP request. Already-authorized in-flight work may finish.
- A PostgreSQL atomic counter enforces 120 authenticated HTTP requests/minute/key across all instances and both transports. 429 includes Retry-After: 60.
- Add IP-based rate limiting, request timeouts and request-size limits at your reverse proxy for unauthenticated traffic. The application key limiter is not a substitute for DDoS protection.
- Private API/MCP responses are no-store; browser cross-origin requests are rejected. Use server-side clients, never browser bundles, URLs, prompts, logs or public environment variables for secrets.
- REST and MCP validate schemas and blog ownership of linked records. Post relation replacements and publication checks use transactions/row locks.
- Status published makes content public immediately; publishedAt is metadata, not a scheduler. Agents should default to drafts and obtain approval before publishing or deleting.
- Uploaded media is public, validated by file signature, stored under server-generated names, and never fetched from arbitrary URLs. Signatures are not a full malware scan. Deleting a post does not delete image objects.
- After ambiguous write failures, check for saved content before retrying; POST does not provide idempotency keys.
- Public renderers sanitize HTML. Still treat editorial content as untrusted, including instructions embedded in text received by an agent.

### Deploying the API-key migration

Back up the database, review the migration, and apply it **before starting the new application**:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

The initial API key migration is `prisma/migrations/20260831010000_add_api_keys/migration.sql`. It adds ApiKey and does not modify existing content. For Docker/Dokploy, run migrations in a controlled release step with Prisma CLI and production DATABASE_URL available; the minimal runtime image does not include the Prisma CLI. Do not use migrate dev or db push in production. Do not run migrations automatically in every replica at startup.

The `20260831130000_add_api_key_never_expires` migration adds `neverExpires` and makes `expiresAt` optional. Existing keys issued for 365 days (within one minute of clock/transaction skew) become non-expiring without changing their tokens, permissions or revocation state. Their original expiry timestamp is retained for compatibility while the old release is still running; the new release ignores it when `neverExpires` is true. Apply this migration before deploying the new application. Newly created non-expiring keys store a null expiry.

After deployment: sign in as owner, create a least-privilege key, verify list/create/update draft/category, confirm publication is denied without publish scope, test MCP initialize/list/call and stdio, revoke the key and confirm 401. Check another blog’s access is denied and public GET never returns the draft.

Rollback: previous app versions ignore ApiKey, so the additive table can remain. Do not drop it as a routine rollback; doing so irreversibly loses key metadata.

## Development and architecture

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

- `lib/integrations/`: scopes, schemas, operation catalog, key authentication, HTTP guardrails, MCP adapter and OpenAPI.
- `src/server/services/content/`: shared editorial business logic, dashboard adapter and cache invalidation.
- `src/server/services/api-keys/`: owner-only session-authenticated key management.
- `src/server/services/media/`: shared image validation/storage.
- `app/api/v1/`, `app/api/mcp/`: thin REST and MCP HTTP transports.
- `scripts/mcp-stdio.mjs`: standalone local-to-remote MCP bridge.
- `components/Integrations/`: dashboard settings and reusable MCP documentation.
- `app/docs/`: in-app public and private API guides.
- `tests/`: automated regression/security tests.

REST endpoint routing, MCP tool registration and the OpenAPI document use one operation catalog. The dashboard’s core post/category/author mutations call the same service. Existing bulk import and paid translation workflows remain session-only.

## References and support

- [MCP transport specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [Official TypeScript MCP SDK](https://ts.sdk.modelcontextprotocol.io/)
- [Cloudflare R2 with AWS SDK v3](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/)
- [GitHub issues](https://github.com/raulcanodev/zenex-cms/issues)

See [MAINTENANCE.md](MAINTENANCE.md) for verification and deployment notes.

import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function PostsApiDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              GET Posts
            </h1>
            <p className="text-lg text-muted-foreground">
              Fetch a list of published posts with pagination support.
            </p>
          </div>

          <DocsSection id="endpoint" title="Endpoint">
            <DocsCodeBlock
              language="bash"
              code="GET /api/blogs/{blogId}/posts"
              filename="Endpoint"
            />
          </DocsSection>

          <DocsSection id="parameters" title="Query Parameters">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><code className="rounded bg-muted px-1.5 py-0.5">page</code> - Page number (default: 1)</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">limit</code> - Posts per page (default: 10)</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">category</code> - Filter by category ID (optional)</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">language</code> - Filter by language code (ISO 639-1, optional)</li>
            </ul>
          </DocsSection>

          <DocsSection id="response" title="Response">
            <DocsCodeBlock
              language="json"
              code={`{
  "data": [
    {
      "id": "clx1234567890",
      "title": "My First Post",
      "slug": "my-first-post",
      "excerpt": "A short description of the post",
      "coverImage": "https://example.com/image.jpg",
      "language": "en",
      "html": "<p class=\\"zenex-cms__paragraph\\">A short description of the post</p>",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "categories": [
        {
          "id": "cat123",
          "name": "Technology",
          "slug": "technology"
        }
      ],
      "tags": [
        {
          "id": "tag123",
          "name": "JavaScript",
          "slug": "javascript"
        }
      ],
      "metaTitle": "SEO optimized title",
      "metaDescription": "SEO description",
      "ogImage": "https://example.com/og-image.jpg",
      "ogTitle": "Social media title",
      "ogDescription": "Social media description",
      "canonicalUrl": "https://example.com/blog/my-first-post",
      "keywords": "javascript, web development"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}`}
              filename="Response"
            />
          </DocsSection>

          <DocsSection id="example" title="Example">
            <DocsCodeBlock
              language="typescript"
              code={`const blogId = "your-blog-id";
const page = 1;
const limit = 10;

const res = await fetch(
  \`https://yourdomain.com/api/blogs/\${blogId}/posts?page=\${page}&limit=\${limit}\`
);
const { data: posts, pagination } = await res.json();

console.log(\`Total posts: \${pagination.total}\`);
console.log(\`Total pages: \${pagination.totalPages}\`);

// Render content using post.html
// See "GET Single Post" documentation for styling instructions.`}
              filename="example.ts"
            />
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

import { DocsSection } from "./DocsSection";
import { DocsCodeBlock } from "./DocsCodeBlock";
import { DocsTableOfContents } from "./DocsTableOfContents";
import { config } from "@/data/config";

export function DocsContent() {
  const sections = [
    { id: "nextjs", title: "Get started with Next.js" },
    { id: "astro", title: "Get started with Astro" },
    { id: "get-posts", title: "GET Posts" },
    { id: "get-post", title: "GET Single Post" },
    { id: "get-categories", title: "GET Categories" },
    { id: "get-tags", title: "GET Tags" },
  ];

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_220px]">
      <div className="mx-auto w-full min-w-0 max-w-3xl">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome to the {config.appName} documentation. Get started by integrating our headless CMS API into your Next.js or Astro project.
          </p>
        </div>

        {/* Next.js Section */}
        <DocsSection id="nextjs" title="Get started with Next.js">
          <p className="mb-4 text-muted-foreground">
            Create a blog in your dashboard and copy your <strong>Blog ID</strong>. All API requests use your public Blog ID - no authentication required.
          </p>
          <DocsCodeBlock
            language="typescript"
            code={`// app/blog/page.tsx
export default async function BlogPage() {
  const blogId = "your-blog-id"; // Get from dashboard
  const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts?page=1&limit=10\`);
  const { data: posts, pagination } = await res.json();

  return (
    <div>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <a href={\`/blog/\${post.slug}\`}>Read more</a>
        </article>
      ))}
    </div>
  );
}`}
            filename="app/blog/page.tsx"
          />
        </DocsSection>

        {/* Astro Section */}
        <DocsSection id="astro" title="Get started with Astro">
          <p className="mb-4 text-muted-foreground">
            Fetch posts in your Astro component using the same API endpoints.
          </p>
          <DocsCodeBlock
            language="astro"
            code={`---
// src/pages/blog.astro
const blogId = "your-blog-id";
const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts?page=1&limit=10\`);
const { data: posts, pagination } = await res.json();
---

<div>
  {posts.map((post) => (
    <article>
      <h2>{post.title}</h2>
      <p>{post.excerpt}</p>
      <a href={\`/blog/\${post.slug}\`}>Read more</a>
    </article>
  ))}
</div>`}
            filename="src/pages/blog.astro"
          />
        </DocsSection>

        {/* GET Posts Section */}
        <DocsSection id="get-posts" title="GET Posts">
          <p className="mb-4 text-muted-foreground">
            Fetch a list of published posts with pagination support.
          </p>
          <DocsCodeBlock
            language="bash"
            code="GET /api/blogs/{blogId}/posts"
            filename="Endpoint"
          />
          <div className="mt-4">
            <h3 className="mb-2 text-lg font-semibold">Query Parameters</h3>
            <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
              <li><code className="rounded bg-muted px-1.5 py-0.5">page</code> - Page number (default: 1)</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">limit</code> - Posts per page (default: 10)</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">category</code> - Filter by category ID</li>
            </ul>
          </div>
          <DocsCodeBlock
            language="json"
            code={`{
  "data": [
    {
      "id": "...",
      "title": "My First Post",
      "slug": "my-first-post",
      "excerpt": "A short description",
      "coverImage": "https://...",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "categories": [{ "id": "...", "name": "Tech", "slug": "tech" }],
      "tags": [{ "id": "...", "name": "JavaScript", "slug": "javascript" }],
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description"
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

        {/* GET Single Post Section */}
        <DocsSection id="get-post" title="GET Single Post">
          <p className="mb-4 text-muted-foreground">
            Fetch a single post by slug, including full content.
          </p>
          <DocsCodeBlock
            language="bash"
            code="GET /api/blogs/{blogId}/posts/{slug}"
            filename="Endpoint"
          />
          <DocsCodeBlock
            language="json"
            code={`{
  "data": {
    "id": "...",
    "title": "My First Post",
    "slug": "my-first-post",
    "content": { "blocks": [...] }, // Editor.js format
    "excerpt": "A short description",
    "coverImage": "https://...",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "categories": [...],
    "tags": [...],
    "metaTitle": "SEO Title",
    "metaDescription": "SEO Description",
    "ogImage": "https://...",
    "canonicalUrl": "https://..."
  }
}`}
            filename="Response"
          />
        </DocsSection>

        {/* GET Categories Section */}
        <DocsSection id="get-categories" title="GET Categories">
          <p className="mb-4 text-muted-foreground">
            Fetch all categories for a blog.
          </p>
          <DocsCodeBlock
            language="bash"
            code="GET /api/blogs/{blogId}/categories"
            filename="Endpoint"
          />
          <DocsCodeBlock
            language="json"
            code={`{
  "data": [
    {
      "id": "...",
      "name": "Technology",
      "slug": "technology",
      "description": "Tech-related posts",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}`}
            filename="Response"
          />
        </DocsSection>

        {/* GET Tags Section */}
        <DocsSection id="get-tags" title="GET Tags">
          <p className="mb-4 text-muted-foreground">
            Fetch all tags for a blog.
          </p>
          <DocsCodeBlock
            language="bash"
            code="GET /api/blogs/{blogId}/tags"
            filename="Endpoint"
          />
          <DocsCodeBlock
            language="json"
            code={`{
  "data": [
    {
      "id": "...",
      "name": "JavaScript",
      "slug": "javascript",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}`}
            filename="Response"
          />
        </DocsSection>
      </div>

      {/* Table of Contents - Desktop only */}
      <DocsTableOfContents sections={sections} />
    </main>
  );
}

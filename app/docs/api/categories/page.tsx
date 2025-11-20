import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function CategoriesApiDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              GET Categories
            </h1>
            <p className="text-lg text-muted-foreground">
              Fetch all categories for a blog.
            </p>
          </div>

          <DocsSection id="endpoint" title="Endpoint">
            <DocsCodeBlock
              language="bash"
              code="GET /api/blogs/{blogId}/categories"
              filename="Endpoint"
            />
          </DocsSection>

          <DocsSection id="response" title="Response">
            <DocsCodeBlock
              language="json"
              code={`{
  "data": [
    {
      "id": "cat123",
      "name": "Technology",
      "slug": "technology",
      "description": "Posts about technology",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "cat124",
      "name": "Design",
      "slug": "design",
      "description": "Posts about design",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}`}
              filename="Response"
            />
          </DocsSection>

          <DocsSection id="example" title="Example">
            <DocsCodeBlock
              language="typescript"
              code={`const blogId = "your-blog-id";

const res = await fetch(
  \`https://yourdomain.com/api/blogs/\${blogId}/categories\`
);
const { data: categories } = await res.json();

// Use categories for filtering posts
categories.forEach(category => {
  console.log(\`\${category.name}: \${category.slug}\`);
});`}
              filename="example.ts"
            />
          </DocsSection>

          <DocsSection id="filtering" title="Filter Posts by Category">
            <p className="mb-4 text-muted-foreground">
              Use the category ID to filter posts in the posts endpoint.
            </p>
            <DocsCodeBlock
              language="typescript"
              code={`const categoryId = "cat123";
const res = await fetch(
  \`https://yourdomain.com/api/blogs/\${blogId}/posts?category=\${categoryId}\`
);`}
              filename="example.ts"
            />
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

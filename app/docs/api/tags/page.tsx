import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function TagsApiDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              GET Tags
            </h1>
            <p className="text-lg text-muted-foreground">
              Fetch all tags for a blog.
            </p>
          </div>

          <DocsSection id="endpoint" title="Endpoint">
            <DocsCodeBlock
              language="bash"
              code="GET /api/blogs/{blogId}/tags"
              filename="Endpoint"
            />
          </DocsSection>

          <DocsSection id="response" title="Response">
            <DocsCodeBlock
              language="json"
              code={`{
  "data": [
    {
      "id": "tag123",
      "name": "JavaScript",
      "slug": "javascript",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "tag124",
      "name": "React",
      "slug": "react",
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
  \`https://yourdomain.com/api/blogs/\${blogId}/tags\`
);
const { data: tags } = await res.json();

// Display tags
tags.forEach(tag => {
  console.log(\`\${tag.name} (/tags/\${tag.slug})\`);
});`}
              filename="example.ts"
            />
          </DocsSection>

          <DocsSection id="usage" title="Common Use Cases">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Display a tag cloud on your blog</li>
              <li>• Show related tags on post pages</li>
              <li>• Create tag archive pages</li>
              <li>• Filter content by tags (available in post data)</li>
            </ul>
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

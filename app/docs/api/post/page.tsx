import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function PostApiDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              GET Single Post
            </h1>
            <p className="text-lg text-muted-foreground">
              Fetch a single post by slug, including full content.
            </p>
          </div>

          <DocsSection id="endpoint" title="Endpoint">
            <DocsCodeBlock
              language="bash"
              code="GET /api/blogs/{blogId}/posts/{slug}"
              filename="Endpoint"
            />
          </DocsSection>

          <DocsSection id="response" title="Response">
            <DocsCodeBlock
              language="json"
              code={`{
  "data": {
    "id": "clx1234567890",
    "title": "My First Post",
    "slug": "my-first-post",
    "content": {
      "time": 1672531200000,
      "blocks": [
        {
          "type": "paragraph",
          "data": {
            "text": "This is the post content in Editor.js format."
          }
        }
      ],
      "version": "2.28.0"
    },
    "excerpt": "A short description",
    "coverImage": "https://example.com/image.jpg",
    "language": "en",
    "publishedAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "categories": [...],
    "tags": [...],
    "metaTitle": "SEO Title",
    "metaDescription": "SEO Description",
    "ogImage": "https://example.com/og-image.jpg",
    "ogTitle": "Social Title",
    "ogDescription": "Social Description",
    "canonicalUrl": "https://example.com/blog/my-first-post",
    "keywords": "javascript, web"
  }
}`}
              filename="Response"
            />
          </DocsSection>

          <DocsSection id="example" title="Example">
            <DocsCodeBlock
              language="typescript"
              code={`const blogId = "your-blog-id";
const slug = "my-first-post";

const res = await fetch(
  \`https://yourdomain.com/api/blogs/\${blogId}/posts/\${slug}\`
);
const { data: post } = await res.json();

console.log(post.title);
console.log(post.content); // Editor.js format`}
              filename="example.ts"
            />
          </DocsSection>

          <DocsSection id="content-format" title="Content Format">
            <p className="mb-4 text-muted-foreground">
              The content field uses <a href="https://editorjs.io/" target="_blank" rel="noopener" className="text-primary underline">Editor.js</a> format. 
              You&apos;ll need to render it using an Editor.js renderer or parse the blocks manually.
            </p>
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

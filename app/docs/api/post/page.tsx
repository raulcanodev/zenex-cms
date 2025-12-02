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
    "html": "<p class=\\"zenex-cms__paragraph\\">This is the post content in Editor.js format.</p>",
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
              The content is available in two formats:
            </p>
            <ul className="mb-4 list-disc pl-6 text-muted-foreground">
              <li><code className="rounded bg-muted px-1.5 py-0.5">content</code> - Raw <a href="https://editorjs.io/" target="_blank" rel="noopener" className="text-primary underline">Editor.js</a> JSON blocks structure.</li>
              <li><code className="rounded bg-muted px-1.5 py-0.5">html</code> - Server-side rendered HTML with <code className="rounded bg-muted px-1.5 py-0.5">zenex-cms__*</code> classes.</li>
            </ul>
          </DocsSection>

          <DocsSection id="styling" title="Rendering & Styling">
            <p className="mb-4 text-muted-foreground">
              The easiest way to render post content is to use the <code className="rounded bg-muted px-1.5 py-0.5">html</code> field and include our default stylesheet.
            </p>

            <h3 className="mb-2 text-lg font-semibold">1. Render HTML</h3>
            <div className="mb-6">
              <p className="mb-2 text-sm text-muted-foreground">In React / Next.js:</p>
              <DocsCodeBlock
                language="tsx"
                code={`<div 
  className="zenex-cms-content"
  dangerouslySetInnerHTML={{ __html: post.html }} 
/>`}
                filename="Post.tsx"
              />
            </div>

            <div className="mb-6">
              <p className="mb-2 text-sm text-muted-foreground">In Astro:</p>
              <DocsCodeBlock
                language="astro"
                code={`<div class="zenex-cms-content" set:html={post.html} />`}
                filename="Post.astro"
              />
            </div>

            <h3 className="mb-2 text-lg font-semibold">2. Add Styles</h3>
            <p className="mb-4 text-muted-foreground">
              Copy the following CSS to your project (e.g., <code className="rounded bg-muted px-1.5 py-0.5">zenex-cms.css</code>) and import it.
            </p>
            
            <DocsCodeBlock
              language="css"
              code={`/* Zenex CMS Default Styles */

.zenex-cms__header {
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5rem 0 1rem;
  color: inherit;
}

.zenex-cms__h1 { font-size: 2.25rem; font-weight: 800; }
.zenex-cms__h2 { font-size: 1.875rem; font-weight: 700; }
.zenex-cms__h3 { font-size: 1.5rem; font-weight: 600; }
.zenex-cms__h4 { font-size: 1.25rem; font-weight: 600; }

.zenex-cms__paragraph {
  font-size: 1rem;
  line-height: 1.75;
  margin: 0.75rem 0;
  color: inherit;
}

.zenex-cms__list {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.zenex-cms__list-item {
  margin: 0.25rem 0;
  line-height: 1.75;
}

.zenex-cms__list--unordered { list-style-type: disc; }
.zenex-cms__list--ordered { list-style-type: decimal; }

.zenex-cms__quote {
  border-left: 4px solid currentColor;
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  opacity: 0.9;
}

.zenex-cms__code-block {
  background-color: #111827;
  color: #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin: 1.5rem 0;
  overflow-x: auto;
  border: 1px solid #374151;
}

.zenex-cms__code {
  font-family: monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: inherit;
}

.zenex-cms__image-figure { margin: 1.5rem 0; }
.zenex-cms__image {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
.zenex-cms__image-caption {
  font-size: 0.875rem;
  text-align: center;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.zenex-cms__link-tool {
  border: 1px solid currentColor;
  opacity: 0.8;
  border-radius: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  display: block;
  text-decoration: none;
}`}
              filename="zenex-cms.css"
            />
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

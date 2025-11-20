import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function NextJsDocsPage() {
  return (
    <DocsLayout>
      <>
        <DocsSidebar />
        <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              Get started with Next.js
            </h1>
            <p className="text-lg text-muted-foreground">
              Integrate your headless CMS into your Next.js application.
            </p>
          </div>

          <DocsSection id="setup" title="Setup">
            <p className="mb-4 text-muted-foreground">
              Create a blog in your dashboard and copy your <strong>Blog ID</strong>. All API requests use your public Blog ID - no authentication required.
            </p>
            <DocsCodeBlock
              language="typescript"
              code={`// app/blog/page.tsx
export default async function BlogPage() {
  const blogId = "your-blog-id";
  const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts?page=1&limit=10\`);
  const { data: posts } = await res.json();

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

          <DocsSection id="single-post" title="Fetch Single Post">
            <p className="mb-4 text-muted-foreground">
              Create a dynamic route to fetch individual posts by slug.
            </p>
            <DocsCodeBlock
              language="typescript"
              code={`// app/blog/[slug]/page.tsx
export default async function PostPage({ params }: { params: { slug: string } }) {
  const blogId = "your-blog-id";
  const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts/\${params.slug}\`);
  const { data: post } = await res.json();

  return (
    <article>
      <h1>{post.title}</h1>
      {post.coverImage && <img src={post.coverImage} alt={post.title} />}
      <p>{post.excerpt}</p>
      {/* Render post.content (Editor.js format) */}
    </article>
  );
}`}
              filename="app/blog/[slug]/page.tsx"
            />
          </DocsSection>

          <DocsSection id="filtering" title="Filtering by Category">
            <p className="mb-4 text-muted-foreground">
              Filter posts by category using query parameters.
            </p>
            <DocsCodeBlock
              language="typescript"
              code={`const res = await fetch(
  \`https://yourdomain.com/api/blogs/\${blogId}/posts?category=\${categoryId}\`
);`}
              filename="app/blog/page.tsx"
            />
          </DocsSection>
        </div>
      </main>
      </>
    </DocsLayout>
  );
}

import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";

export default function AstroDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              Get started with Astro
            </h1>
            <p className="text-lg text-muted-foreground">
              Integrate your headless CMS into your Astro application.
            </p>
          </div>

          <DocsSection id="setup" title="Setup">
            <p className="mb-4 text-muted-foreground">
              Create a blog in your dashboard and copy your <strong>Blog ID</strong>. Fetch posts in your Astro component using the API endpoints.
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

          <DocsSection id="single-post" title="Dynamic Routes">
            <p className="mb-4 text-muted-foreground">
              Use Astro&apos;s dynamic routes to fetch individual posts.
            </p>
            <DocsCodeBlock
              language="astro"
              code={`---
// src/pages/blog/[slug].astro
const { slug } = Astro.params;
const blogId = "your-blog-id";
const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts/\${slug}\`);
const { data: post } = await res.json();
---

<article>
  <h1>{post.title}</h1>
  {post.coverImage && <img src={post.coverImage} alt={post.title} />}
  <p>{post.excerpt}</p>
</article>`}
              filename="src/pages/blog/[slug].astro"
            />
          </DocsSection>

          <DocsSection id="static-paths" title="Static Site Generation">
            <p className="mb-4 text-muted-foreground">
              Generate static pages at build time using getStaticPaths.
            </p>
            <DocsCodeBlock
              language="astro"
              code={`---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const blogId = "your-blog-id";
  const res = await fetch(\`https://yourdomain.com/api/blogs/\${blogId}/posts?limit=100\`);
  const { data: posts } = await res.json();
  
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
---

<article>
  <h1>{post.title}</h1>
  <p>{post.excerpt}</p>
</article>`}
              filename="src/pages/blog/[slug].astro"
            />
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}

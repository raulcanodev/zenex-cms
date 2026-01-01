"use client";

import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { DocsCodeBlock } from "@/components/Docs/DocsCodeBlock";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const CURSOR_PROMPT = `I need to integrate Zenex CMS (a headless CMS) into my Astro application.

## SETUP

First, add your CMS URL to .env:
PUBLIC_CMS_URL=https://cms.zenex.dev
PUBLIC_BLOG_ID=your-blog-id

You can use the hosted version at cms.zenex.dev or your own self-hosted deployment.

## API ENDPOINTS

All endpoints require the full CMS URL. Examples use import.meta.env.PUBLIC_CMS_URL.

### GET {CMS_URL}/api/blogs/{blogId}/posts
List all published posts with pagination.

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- category: string (category ID, optional)
- tag: string (tag ID, optional)
- language: string (ISO 639-1 code like 'en', 'es', 'fr', optional)

Response:
{
  "data": [
    {
      "id": "clx1234567890",
      "title": "My First Post",
      "slug": "my-first-post",
      "excerpt": "Short description",
      "coverImage": "https://example.com/image.jpg",
      "language": "en",
      "html": "<p class='zenex-cms__paragraph'>Content as HTML</p>",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "categories": [{ "id": "cat1", "name": "Tech", "slug": "tech" }],
      "tags": [{ "id": "tag1", "name": "JavaScript", "slug": "javascript" }],
      "metaTitle": "SEO Title",
      "metaDescription": "SEO Description",
      "ogImage": "https://example.com/og.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}

### GET {CMS_URL}/api/blogs/{blogId}/posts/{slug}
Get single post by slug with full content.

Response:
{
  "data": {
    "id": "clx1234567890",
    "title": "My First Post",
    "slug": "my-first-post",
    "content": {
      "time": 1672531200000,
      "blocks": [
        { "type": "paragraph", "data": { "text": "Content" } },
        { "type": "header", "data": { "text": "Heading", "level": 2 } },
        { "type": "list", "data": { "style": "unordered", "items": ["Item 1"] } },
        { "type": "code", "data": { "code": "const x = 1;" } },
        { "type": "image", "data": { "file": { "url": "image.jpg" }, "caption": "Caption" } }
      ],
      "version": "2.28.0"
    },
    "html": "<p class='zenex-cms__paragraph'>Pre-rendered HTML content</p>",
    "excerpt": "Short description",
    "coverImage": "https://example.com/image.jpg",
    "language": "en",
    "categories": [...],
    "tags": [...],
    "metaTitle": "SEO Title",
    "keywords": "javascript, web"
  }
}

### GET {CMS_URL}/api/blogs/{blogId}/categories
Get all categories.

Response: { "data": [{ "id": "cat1", "name": "Tech", "slug": "tech" }] }

### GET {CMS_URL}/api/blogs/{blogId}/tags
Get all tags.

Response: { "data": [{ "id": "tag1", "name": "JavaScript", "slug": "javascript" }] }

## RENDERING CONTENT

The API returns content in two formats:
1. content: Raw Editor.js JSON (for custom rendering)
2. html: Pre-rendered HTML with zenex-cms__* classes (recommended)

To style the HTML, import the stylesheet from your CMS domain:
<link rel="stylesheet" href={\`\${import.meta.env.PUBLIC_CMS_URL}/zenex-cms.css\`} />

## TASKS

1. Create src/pages/blog.astro:
   - Fetch posts with pagination
   - Display post cards with title, excerpt, cover image
   - Add pagination controls
   - Optional: Add category/tag filters

2. Create src/pages/blog/[slug].astro:
   - Use getStaticPaths() to fetch all post slugs at build time
   - Fetch single post by slug
   - Display full post with metadata
   - Render HTML content using set:html directive
   - Add SEO meta tags (metaTitle, metaDescription, ogImage)

3. Optional: Create src/pages/blog/category/[slug].astro for category pages

4. Add error handling for 404s

Example implementation in src/pages/blog/[slug].astro:

---
export async function getStaticPaths() {
  const CMS_URL = import.meta.env.PUBLIC_CMS_URL;
  const BLOG_ID = import.meta.env.PUBLIC_BLOG_ID;
  
  const res = await fetch(\`\${CMS_URL}/api/blogs/\${BLOG_ID}/posts?limit=100\`);
  const { data: posts } = await res.json();
  
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const CMS_URL = import.meta.env.PUBLIC_CMS_URL;

if (!post) {
  return Astro.redirect('/404');
}
---

<!DOCTYPE html>
<html lang={post.language || 'en'}>
<head>
  <title>{post.metaTitle || post.title}</title>
  <meta name="description" content={post.metaDescription || post.excerpt} />
  <meta property="og:image" content={post.ogImage || post.coverImage} />
  <link rel="stylesheet" href={\`\${CMS_URL}/zenex-cms.css\`} />
</head>
<body>
  <article>
    <h1>{post.title}</h1>
    {post.coverImage && <img src={post.coverImage} alt={post.title} />}
    <div set:html={post.html} />
  </article>
</body>
</html>

Don't forget to:
1. Add PUBLIC_CMS_URL and PUBLIC_BLOG_ID to your .env
2. The CSS file is served from your CMS domain automatically`;

export default function AstroDocsPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(CURSOR_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-4">
            <div className="space-y-2">
              <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
                Get started with Astro
              </h1>
              <p className="text-lg text-muted-foreground">
                Integrate your headless CMS into your Astro application.
              </p>
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy prompt for Cursor/Copilot
                </>
              )}
            </Button>
          </div>

          <DocsSection id="setup" title="Setup">
            <p className="mb-4 text-muted-foreground">
              Create a blog in your dashboard and copy your <strong>Blog ID</strong>. Add your CMS URL and Blog ID to your environment variables. You can use <strong>cms.zenex.dev</strong> (hosted) or your own deployment.
            </p>
            <DocsCodeBlock
              language="bash"
              code={`# .env
PUBLIC_CMS_URL=https://cms.zenex.dev
PUBLIC_BLOG_ID=your-blog-id`}
              filename=".env"
            />
            <DocsCodeBlock
              language="astro"
              code={`---
// src/pages/blog.astro
const CMS_URL = import.meta.env.PUBLIC_CMS_URL;
const BLOG_ID = import.meta.env.PUBLIC_BLOG_ID;

const res = await fetch(\`\${CMS_URL}/api/blogs/\${BLOG_ID}/posts?page=1&limit=10\`);
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
const CMS_URL = import.meta.env.PUBLIC_CMS_URL;
const BLOG_ID = import.meta.env.PUBLIC_BLOG_ID;

const res = await fetch(\`\${CMS_URL}/api/blogs/\${BLOG_ID}/posts/\${slug}\`);
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

          <DocsSection id="static-generation" title="Static Site Generation">
            <p className="mb-4 text-muted-foreground">
              Pre-render all blog posts at build time using getStaticPaths.
            </p>
            <DocsCodeBlock
              language="astro"
              code={`---
// src/pages/blog/[slug].astro
export async function getStaticPaths() {
  const CMS_URL = import.meta.env.PUBLIC_CMS_URL;
  const BLOG_ID = import.meta.env.PUBLIC_BLOG_ID;
  
  const res = await fetch(\`\${CMS_URL}/api/blogs/\${BLOG_ID}/posts?limit=100\`);
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
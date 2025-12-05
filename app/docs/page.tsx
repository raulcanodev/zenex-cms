import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";
import { config } from "@/data/config";
import Link from "next/link";

export default function DocsPage() {
  return (
    <DocsLayout>
      <>
        <DocsSidebar />
        <main className="relative py-6 lg:gap-10 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-3xl">
            <div className="mb-8 space-y-2">
              <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
                Documentation
              </h1>
              <p className="text-lg text-muted-foreground">
                Welcome to {config.appName}. A headless CMS for developers who want to focus on building, not managing content.
              </p>
            </div>

            <DocsSection id="getting-started" title="Getting Started">
              <p className="mb-4 text-muted-foreground">
                Get started by integrating {config.appName} into your project:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  href="/docs/nextjs"
                  className="group rounded-lg border p-6 hover:border-foreground transition-colors"
                >
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">Next.js →</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to integrate with Next.js App Router
                  </p>
                </Link>
                <Link
                  href="/docs/astro"
                  className="group rounded-lg border p-6 hover:border-foreground transition-colors"
                >
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">Astro →</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn how to integrate with Astro
                  </p>
                </Link>
              </div>
            </DocsSection>

            <DocsSection id="api" title="API Reference">
              <p className="mb-4 text-muted-foreground">
                Explore our REST API endpoints:
              </p>
              <div className="space-y-3">
                <Link
                  href="/docs/api/posts"
                  className="block rounded-lg border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-mono text-green-600 dark:text-green-400">GET</span>
                    <span className="font-mono text-sm">GET Posts</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Fetch paginated list of posts</p>
                </Link>
                <Link
                  href="/docs/api/post"
                  className="block rounded-lg border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-mono text-green-600 dark:text-green-400">GET</span>
                    <span className="font-mono text-sm">GET Single Post</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Fetch a single post with full content</p>
                </Link>
                <Link
                  href="/docs/api/categories"
                  className="block rounded-lg border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-mono text-green-600 dark:text-green-400">GET</span>
                    <span className="font-mono text-sm">GET Categories</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Fetch all categories</p>
                </Link>
                <Link
                  href="/docs/api/tags"
                  className="block rounded-lg border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-green-500/10 px-2 py-1 text-xs font-mono text-green-600 dark:text-green-400">GET</span>
                    <span className="font-mono text-sm">GET Tags</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Fetch all tags</p>
                </Link>
              </div>
            </DocsSection>

            <DocsSection id="features" title="Key Features">
              <p className="mb-4 text-muted-foreground">
                Explore additional features:
              </p>
              <div className="space-y-3 mb-6">
                <Link
                  href="/docs/members"
                  className="block rounded-lg border p-4 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Blog Members</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Manage blog access by adding members via email. Members can access and edit the blog.
                  </p>
                </Link>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>No authentication</strong> - Public API using Blog ID</li>
                <li>• <strong>Pagination</strong> - Built-in pagination support</li>
                <li>• <strong>Rich content</strong> - Editor.js format for flexible content</li>
                <li>• <strong>SEO ready</strong> - Meta tags and Open Graph included</li>
                <li>• <strong>Categories & Tags</strong> - Organize your content</li>
                <li>• <strong>Multi-language support</strong> - Translate posts to multiple languages</li>
                <li>• <strong>Team collaboration</strong> - Add members to collaborate on blogs</li>
              </ul>
            </DocsSection>
          </div>
        </main>
      </>
    </DocsLayout>
  );
}

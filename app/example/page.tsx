import { ExamplePostCard } from "@/components/ExamplePostCard/ExamplePostCard";
import { ExamplePagination } from "@/components/ExamplePagination/ExamplePagination";
import { ExampleBlogIdInput } from "@/components/ExampleBlogIdInput/ExampleBlogIdInput";
import { headers } from "next/headers";
import type { OutputData } from "@editorjs/editorjs";
import "@/public/zenex-cms.css"; // Import default styles for rendered content

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: OutputData;
  html?: string; // Added html field
  excerpt?: string | null;
  coverImage?: string | null;
  language?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  canonicalUrl?: string | null;
  keywords?: string | null;
}

interface ApiResponse {
  data: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:4444";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function fetchPosts(blogId: string, page: number = 1, status?: string): Promise<ApiResponse | null> {
  try {
    const baseUrl = await getBaseUrl();
    // For testing, show all posts if no status specified, or use the provided status
    const statusParam = status ? `&status=${status}` : "";
    const url = `${baseUrl}/api/blogs/${blogId}/posts?page=${page}&limit=2${statusParam}`;
    
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return null;
  }
}

async function fetchPostContent(blogId: string, slug: string): Promise<OutputData | null> {
  try {
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/api/blogs/${blogId}/posts/${slug}`;
    
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data.content as OutputData;
  } catch (error) {
    console.error("Error fetching post content:", error);
    return null;
  }
}

export default async function ExamplePage({
  searchParams,
}: {
  searchParams: Promise<{ blogId?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const blogId = params.blogId;
  const page = parseInt(params.page || "1", 10);
  const status = params.status; // undefined = all posts, "published" = only published, "draft" = only drafts

  if (!blogId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">CMS Example</h1>
            <p className="text-lg text-muted-foreground">
              Enter your blog ID to view posts using the CMS API
            </p>
          </div>
          <ExampleBlogIdInput />
        </div>
      </div>
    );
  }

  const postsData = await fetchPosts(blogId, page, status);

  if (!postsData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-4xl px-6 py-12">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">CMS Example</h1>
            <p className="mb-4 text-lg text-destructive">
              Error: Blog not found or unable to fetch posts.
            </p>
            <ExampleBlogIdInput />
          </div>
        </div>
      </div>
    );
  }

  // Use content directly from the API response (now included in the list endpoint)
  const postsWithContent = postsData.data.map((post) => ({
    ...post,
    content: (post as any).content || { blocks: [] },
    html: (post as any).html, // Pass html field
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">CMS Example</h1>
          <p className="text-lg text-muted-foreground">
            Displaying posts from blog: <code className="rounded bg-muted px-2 py-1 text-sm">{blogId}</code>
          </p>
        </div>

        {postsWithContent.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No posts found.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {postsWithContent.map((post) => (
                <ExamplePostCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  language={post.language}
                  publishedAt={post.publishedAt}
                  categories={post.categories}
                  tags={post.tags}
                  content={post.content}
                  html={post.html}
                />
              ))}
            </div>

            <ExamplePagination
              currentPage={postsData.pagination.page}
              totalPages={postsData.pagination.totalPages}
              blogId={blogId}
            />
          </>
        )}
      </div>
    </div>
  );
}


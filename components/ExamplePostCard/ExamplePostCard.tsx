import { getLanguageName } from "@/lib/languages";
import type { OutputData } from "@editorjs/editorjs";
import NextImage from "next/image";

interface ExamplePostCardProps {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  language?: string | null;
  publishedAt?: string | null;
  categories?: Array<{ id: string; name: string; slug: string }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  content?: OutputData;
  html?: string; // Added html prop
}

export function ExamplePostCard({
  title,
  slug,
  excerpt,
  coverImage,
  language,
  publishedAt,
  categories,
  tags,
  content,
  html, // Destructure html
}: ExamplePostCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const languageName = language ? getLanguageName(language) : null;

  return (
    <article className="mb-12 border-b pb-12 last:border-b-0 last:pb-0">
      {/* Cover Image */}
      {coverImage && (
        <div className="mb-6 overflow-hidden rounded-lg">
          <NextImage
            src={coverImage}
            alt={title}
            width={800}
            height={400}
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="mb-4 text-4xl font-bold">{title}</h1>

      {/* Metadata */}
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {formattedDate && <span>{formattedDate}</span>}
        {languageName && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span>{languageName}</span>
          </>
        )}
      </div>

      {/* Excerpt */}
      {excerpt && (
        <p className="mb-6 text-lg leading-7 text-muted-foreground">{excerpt}</p>
      )}

      {/* Categories and Tags */}
      {(categories && categories.length > 0) || (tags && tags.length > 0) ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Content - Render HTML directly */}
      {html ? (
        <div 
          className="zenex-cms-content mt-8"
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      ) : (
        <div className="text-muted-foreground italic">
          No HTML content available.
        </div>
      )}
    </article>
  );
}


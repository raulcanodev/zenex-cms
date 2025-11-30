import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getLanguageName } from "@/lib/languages";

interface PostCardProps {
  id: string;
  blogId: string;
  title: string;
  publishedAt: Date | null;
  status: string;
  coverImage?: string | null;
  language?: string | null;
}

export function PostCard({
  id,
  blogId,
  title,
  publishedAt,
  status,
  coverImage,
  language,
}: PostCardProps) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const languageName = language ? getLanguageName(language) : null;

  return (
    <Link href={`/dashboard/blogs/${blogId}/posts/${id}/edit`}>
      <Card className="cursor-pointer transition-colors hover:bg-muted/50">
        <CardContent className="flex items-center gap-4 px-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-muted">
            {coverImage ? (
              <img src={coverImage} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              {formattedDate && <p className="text-sm text-muted-foreground">{formattedDate}</p>}
              {languageName && (
                <span className="text-xs text-muted-foreground">• {languageName}</span>
              )}
            </div>
          </div>
          {status === "published" && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
              Published
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}



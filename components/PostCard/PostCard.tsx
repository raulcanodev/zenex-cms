"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getLanguageName } from "@/lib/languages";
import { updatePost } from "@/src/server/services/posts/mutations";
import { useRouter } from "next/navigation";

interface PostCardProps {
  id: string;
  blogId: string;
  title: string;
  publishedAt: Date | null;
  status: string;
  coverImage?: string | null;
  language?: string | null;
  availableLanguages?: string[];
}

export function PostCard({
  id,
  blogId,
  title,
  publishedAt,
  status,
  coverImage,
  language,
  availableLanguages,
}: PostCardProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isUpdating, setIsUpdating] = useState(false);

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
            <div className="flex flex-wrap items-center gap-2">
              {formattedDate && <p className="text-sm text-muted-foreground">{formattedDate}</p>}
              {languageName && (
                <span className="text-xs text-muted-foreground">• {languageName}</span>
              )}
              {availableLanguages && availableLanguages.length > 1 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex flex-wrap gap-1">
                    {availableLanguages.map((lang) => (
                      <span
                        key={lang}
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          lang === language
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getLanguageName(lang) || lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex items-center gap-2"
          >
            <Label 
              htmlFor={`switch-${id}`}
              className={`text-xs font-medium cursor-pointer ${
                currentStatus === "published" ? "text-green-700" : "text-muted-foreground"
              }`}
            >
              {currentStatus === "published" ? "Published" : "Draft"}
            </Label>
            <Switch
              id={`switch-${id}`}
              checked={currentStatus === "published"}
              onCheckedChange={async (checked) => {
                setIsUpdating(true);
                const newStatus = checked ? "published" : "draft";
                
                const result = await updatePost(id, {
                  status: newStatus as "draft" | "published",
                });

                if (!result.error) {
                  setCurrentStatus(newStatus);
                  router.refresh();
                }
                setIsUpdating(false);
              }}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditAuthorDialog } from "@/components/EditAuthorDialog/EditAuthorDialog";
import { deleteAuthor } from "@/src/server/services/authors/mutations";

interface Author {
  id: string;
  name: string;
  email: string;
  slug: string;
  bio: string | null;
}

interface AuthorsListProps {
  authors: Author[];
  blogId: string;
}

export function AuthorsList({ authors, blogId }: AuthorsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(authorId: string, authorName: string) {
    if (!confirm(`Are you sure you want to delete ${authorName}?`)) {
      return;
    }

    setError("");
    setDeletingId(authorId);

    try {
      const result = await deleteAuthor(authorId);

      if (result.error) {
        setError(result.error);
        setDeletingId(null);
      } else {
        setDeletingId(null);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete author");
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="space-y-2">
        {authors.map((author) => (
          <Card key={author.id}>
            <CardContent className="flex items-center justify-between py-0 px-4">
              <div className="flex-1">
                <h3 className="font-semibold">{author.name}</h3>
                <p className="text-sm text-muted-foreground">{author.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <EditAuthorDialog
                  author={author}
                  blogId={blogId}
                  open={editingId === author.id}
                  onOpenChange={(open) => setEditingId(open ? author.id : null)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={deletingId === author.id || editingId === author.id}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => setEditingId(author.id)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(author.id, author.name)}
                      disabled={deletingId === author.id}
                      className="text-destructive focus:text-destructive"
                    >
                      {deletingId === author.id ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </>
  );
}



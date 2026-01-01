"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deletePost } from "@/src/server/services/posts/mutations";

interface DeletePostDialogProps {
  postId: string;
  postTitle: string;
  blogId: string;
}

export function DeletePostDialog({ postId, postTitle, blogId }: DeletePostDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");

    try {
      const result = await deletePost(postId);

      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
      } else {
        setOpen(false);
        router.push(`/dashboard/blogs/${blogId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
        Delete Post
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Post</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium">Post to delete:</p>
            <p className="text-sm text-muted-foreground mt-1">{postTitle}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/50 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

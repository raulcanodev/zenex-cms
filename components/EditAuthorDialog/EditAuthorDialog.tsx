"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAuthor } from "@/src/server/services/authors/mutations";
import { slugify } from "@/lib/slug";

interface Author {
  id: string;
  name: string;
  email: string;
  slug: string;
  bio: string | null;
}

interface EditAuthorDialogProps {
  author: Author;
  blogId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditAuthorDialog({ author, blogId, open: controlledOpen, onOpenChange }: EditAuthorDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [name, setName] = useState(author.name);
  const [email, setEmail] = useState(author.email);
  const [slug, setSlug] = useState(author.slug);
  const [bio, setBio] = useState(author.bio || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [manualSlug, setManualSlug] = useState(false);

  useEffect(() => {
    if (open) {
      setName(author.name);
      setEmail(author.email);
      setSlug(author.slug);
      setBio(author.bio || "");
      setError("");
      setManualSlug(false);
    }
  }, [open, author]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await updateAuthor(author.id, {
      name,
      email,
      slug: slug || slugify(name),
      bio: bio || undefined,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setOpen(false);
      setIsLoading(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit author</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!manualSlug) {
                  setSlug(slugify(e.target.value));
                }
              }}
              placeholder="Author name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setManualSlug(true);
              }}
              placeholder="author-slug"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="author@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Author bio"
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



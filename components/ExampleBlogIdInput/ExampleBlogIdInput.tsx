"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExampleBlogIdInput() {
  const [blogId, setBlogId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blogId.trim()) return;

    setIsLoading(true);
    // Validate blogId by trying to fetch posts
    try {
      const response = await fetch(`/api/blogs/${blogId.trim()}/posts?page=1&limit=2`);
      if (response.ok) {
        router.push(`/example?blogId=${encodeURIComponent(blogId.trim())}&page=1`);
      } else {
        alert("Blog not found. Please check the blogId and try again.");
        setIsLoading(false);
      }
    } catch (error) {
      alert("Error validating blogId. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="blogId">Enter Blog ID</Label>
        <Input
          id="blogId"
          type="text"
          value={blogId}
          onChange={(e) => setBlogId(e.target.value)}
          placeholder="your-blog-id"
          required
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Enter the blogId (UUID) from your blog settings to view posts.
        </p>
      </div>
      <Button type="submit" disabled={isLoading || !blogId.trim()}>
        {isLoading ? "Loading..." : "View Posts"}
      </Button>
    </form>
  );
}



"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import NextImage from "next/image";

const Editor = dynamic(() => import("@/components/Editor/Editor").then((mod) => ({ default: mod.Editor })), {
  ssr: false,
});
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OutputData } from "@editorjs/editorjs";
import { slugify } from "@/lib/slug";
import { createPost, updatePost } from "@/src/server/services/posts/mutations";
import { ChevronDown, ChevronUp } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector/LanguageSelector";

interface PostFormProps {
  blogId: string;
  post?: {
    id: string;
    title: string;
    slug: string;
    content: OutputData;
    excerpt?: string | null;
    coverImage?: string | null;
    status: string;
    publishedAt?: Date | null;
    authorId?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ogImage?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    canonicalUrl?: string | null;
    keywords?: string | null;
    language?: string | null;
    categories?: Array<{ categoryId: string }>;
    tags?: Array<{ tagId: string }>;
  };
  categories: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; name: string }>;
}

export function PostForm({ blogId, post, categories, tags, authors }: PostFormProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [content, setContent] = useState<OutputData>(post?.content || { blocks: [] });
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [coverImage, setCoverImage] = useState(post?.coverImage || "");
  const [status, setStatus] = useState<"draft" | "published">(
    (post?.status as "draft" | "published") || "draft"
  );
  const [publishedAt, setPublishedAt] = useState(
    post?.publishedAt ? new Date(post.publishedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [metaTitle, setMetaTitle] = useState(post?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(post?.metaDescription || "");
  const [ogImage, setOgImage] = useState(post?.ogImage || "");
  const [ogTitle, setOgTitle] = useState(post?.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(post?.ogDescription || "");
  const [canonicalUrl, setCanonicalUrl] = useState(post?.canonicalUrl || "");
  const [keywords, setKeywords] = useState(post?.keywords || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    post?.categories?.map((c) => c.categoryId) || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map((t) => t.tagId) || []
  );
  const [authorId, setAuthorId] = useState(post?.authorId || "");
  const [language, setLanguage] = useState(post?.language || "en");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!post?.slug);

  // Compute derived values
  const computedSlug = autoSlug && title ? slugify(title) : slug;
  const computedMetaTitle = metaTitle || title;
  const computedMetaDescription = metaDescription || excerpt;
  const computedOgTitle = ogTitle || computedMetaTitle;
  const computedOgDescription = ogDescription || computedMetaDescription;
  const computedOgImage = ogImage || coverImage;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const postData = {
      blogId,
      title,
      slug: computedSlug || slugify(title),
      content,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      status,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      authorId: authorId || undefined,
      language: language || "en",
      metaTitle: computedMetaTitle || undefined,
      metaDescription: computedMetaDescription || undefined,
      ogImage: computedOgImage || undefined,
      ogTitle: computedOgTitle || undefined,
      ogDescription: computedOgDescription || undefined,
      canonicalUrl: canonicalUrl || undefined,
      keywords: keywords || undefined,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    };

    const result = isEditing
      ? await updatePost(post.id, postData)
      : await createPost(postData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(`/dashboard/blogs/${blogId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isEditing ? "Update" : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Cover image - pequeño icono arriba */}
        {coverImage ? (
          <div className="group relative inline-block">
            <NextImage src={coverImage} alt="Cover" width={48} height={48} className="h-12 w-12 rounded object-cover" />
            <button
              type="button"
              onClick={() => setCoverImage("")}
              className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground group-hover:flex"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) setCoverImage(url);
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
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
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            Cover image
          </button>
        )}

        {/* Título grande sin label */}
        <input
          type="text"
          placeholder="Post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border-0 bg-transparent px-0 text-5xl font-bold outline-none placeholder:text-muted-foreground/20"
        />

        {/* Campos principales en grid compacto */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Slug</Label>
            <Input
              value={autoSlug ? computedSlug : slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="a-great-title"
              className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Author</Label>
            <Select value={authorId || "none"} onValueChange={(value) => setAuthorId(value === "none" ? "" : value)}>
              <SelectTrigger className="h-9 w-auto border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/20 dark:focus-visible:bg-muted/20">
                <SelectValue placeholder="Select an author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No author</SelectItem>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Language</Label>
            <LanguageSelector
              value={language}
              onValueChange={setLanguage}
              required
              className="w-auto max-w-md"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Published at</Label>
            <Input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="h-9 w-auto border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
            />
          </div>

          <div className="flex items-start gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0 pt-2">Excerpt</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short description of your post. Recommended to be 155 characters or less."
              rows={2}
              className="resize-none w-auto max-w-md border-0 bg-transparent px-2 py-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
            />
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Category</Label>
            <Select
              value={selectedCategories[0] || ""}
              onValueChange={(value) => setSelectedCategories([value])}
            >
              <SelectTrigger className="h-9 w-auto border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/20 dark:focus-visible:bg-muted/20">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground w-[120px] shrink-0">Tags</Label>
            <Select
              value={selectedTags[0] || ""}
              onValueChange={(value) => {
                if (!selectedTags.includes(value)) {
                  setSelectedTags([...selectedTags, value]);
                }
              }}
            >
              <SelectTrigger className="h-9 w-auto border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/20 dark:focus-visible:bg-muted/20">
                <SelectValue placeholder="Select some tags" />
              </SelectTrigger>
              <SelectContent>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón para mostrar propiedades avanzadas */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showAdvanced ? "Hide" : "Show"} properties
          </button>

          {/* Propiedades avanzadas colapsables */}
          {showAdvanced && (
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as "draft" | "published")}
                >
                  <SelectTrigger className="h-9 w-auto border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/20 dark:focus-visible:bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">Meta Title</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder={computedMetaTitle} className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20" />
              </div>

              <div className="flex items-start gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0 pt-2">Meta Description</Label>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={computedMetaDescription}
                  rows={2}
                  className="resize-none w-auto max-w-md border-0 bg-transparent px-2 py-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">OG Image</Label>
                <Input
                  type="url"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="Open Graph image URL"
                  className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">OG Title</Label>
                <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder={computedOgTitle} className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20" />
              </div>

              <div className="flex items-start gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0 pt-2">OG Description</Label>
                <Textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  placeholder={computedOgDescription}
                  rows={2}
                  className="resize-none w-auto max-w-md border-0 bg-transparent px-2 py-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">Canonical URL</Label>
                <Input
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="text-muted-foreground w-[120px] shrink-0">Keywords</Label>
                <Input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="Comma-separated keywords"
                  className="h-9 w-auto max-w-md border-0 bg-transparent px-2 shadow-none focus-visible:bg-muted/50 focus-visible:ring-0 dark:bg-transparent dark:focus-visible:bg-muted/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Editor de contenido */}
        <div className="pt-6">
          <Editor data={content} onChange={setContent} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}


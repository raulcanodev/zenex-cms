"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { parseMarkdownWithFrontmatter, markdownToEditorJS } from "@/lib/markdown-parser";
import { importPostsInBulk } from "@/src/server/services/posts/bulk-import";
import { slugify } from "@/lib/slug";
import { Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImportPostsDialogProps {
  blogId: string;
}

interface ParsedPost {
  filename: string;
  frontmatter: Record<string, string | boolean | number>;
  content: string;
  editorContent: { 
    time: number; 
    blocks: Array<{ 
      type: string; 
      data: Record<string, string | number | string[][]> 
    }>; 
    version: string 
  };
}

const STEPS = [
  { id: 1, title: "Upload", description: "Select .md files" },
  { id: 2, title: "Map", description: "Map fields" },
  { id: 3, title: "Preview", description: "Review posts" },
  { id: 4, title: "Import", description: "Complete" },
];

export function ImportPostsDialog({ blogId }: ImportPostsDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [parsedPosts, setParsedPosts] = useState<ParsedPost[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({
    title: "title",
    slug: "slug",
    description: "excerpt",
    publishedAt: "publishedAt",
    isPublish: "status",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: string[];
    errors: Array<{ title: string; error: string }>;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Detect available frontmatter fields from uploaded posts
  const availableFrontmatterFields = Array.from(
    new Set(parsedPosts.flatMap((post) => Object.keys(post.frontmatter)))
  );

  const targetFields = [
    { key: "title", label: "Title", required: true },
    { key: "slug", label: "Slug", required: true },
    { key: "excerpt", label: "Excerpt/Description", required: false },
    { key: "publishedAt", label: "Published Date", required: false },
    { key: "status", label: "Status (published/draft)", required: false },
    { key: "featured", label: "Featured", required: false },
    { key: "coverImage", label: "Cover Image", required: false },
    { key: "language", label: "Language", required: false },
    { key: "metaTitle", label: "Meta Title", required: false },
    { key: "metaDescription", label: "Meta Description", required: false },
    { key: "keywords", label: "Keywords", required: false },
  ];

  function handleClose() {
    setOpen(false);
    setCurrentStep(1);
    setParsedPosts([]);
    setImportResults(null);
  }

  async function processFiles(files: FileList | File[]) {
    const parsed: ParsedPost[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".md")) continue;

      const text = await file.text();
      const { frontmatter, content } = parseMarkdownWithFrontmatter(text);
      const editorContent = markdownToEditorJS(content);

      parsed.push({
        filename: file.name,
        frontmatter,
        content,
        editorContent,
      });
    }

    setParsedPosts(parsed);
    if (parsed.length > 0) {
      setCurrentStep(2);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    await processFiles(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  }

  function handleNext() {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleImport() {
    setIsLoading(true);

    type ImportPost = {
      title: string;
      slug: string;
      content: Record<string, unknown>;
      excerpt?: string;
      coverImage?: string;
      status?: "draft" | "published";
      featured?: boolean;
      publishedAt?: string;
      language?: string;
      metaTitle?: string;
      metaDescription?: string;
      keywords?: string;
    };

    // Transform parsed posts to import format
    const postsToImport: ImportPost[] = parsedPosts.map((post) => {
      const mapped: ImportPost = {
        title: '',
        slug: '',
        content: post.editorContent,
      };

      // Map frontmatter fields
      for (const [targetField, sourceField] of Object.entries(fieldMapping)) {
        if (sourceField && post.frontmatter[sourceField] !== undefined) {
          let value: unknown = post.frontmatter[sourceField];

          // Special handling for status
          if (targetField === "status") {
            if (sourceField === "isPublish") {
              value = value === true || value === "true" ? "published" : "draft";
            }
          }

          (mapped as Record<string, unknown>)[targetField] = value;
        }
      }

      // Generate slug if not provided
      if (!mapped.slug && mapped.title) {
        mapped.slug = slugify(String(mapped.title));
      }

      return mapped;
    });

    const result = await importPostsInBulk({
      blogId,
      posts: postsToImport,
      fieldMapping,
    });

    setIsLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.results) {
      setImportResults(result.results);
      setCurrentStep(4);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Posts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Posts from Markdown</DialogTitle>
          <DialogDescription>
            Upload multiple .md files and map their frontmatter to your blog schema
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <Stepper steps={STEPS} currentStep={currentStep} className="mb-8" />

          {/* Step 1: Upload Files */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className={cn(
                  "h-12 w-12 mx-auto mb-4 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragging ? "Drop files here" : "Upload Markdown Files"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag & drop or click to select .md files
                </p>
                <Button type="button" onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}>
                  Choose Files
                </Button>
              </div>
              <div className="rounded-md bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Expected format:</p>
                <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
{`---
title: "Post Title"
slug: "post-slug"
description: "Post description"
publishedAt: 2025-01-21
isPublish: true
---

Your markdown content here...`}
                </pre>
              </div>
            </div>
          )}

          {/* Step 2: Map Fields */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Map Frontmatter Fields</h3>
                <p className="text-sm text-muted-foreground">
                  Found {parsedPosts.length} posts. Map your frontmatter fields to the blog schema.
                </p>
              </div>

              <div className="space-y-3">
                {targetFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <Label className="w-[150px] shrink-0">
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={fieldMapping[field.key] || "__none__"}
                      onValueChange={(value) =>
                        setFieldMapping({ ...fieldMapping, [field.key]: value === "__none__" ? "" : value })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {availableFrontmatterFields.map((frontmatterField) => (
                          <SelectItem key={frontmatterField} value={frontmatterField}>
                            {frontmatterField}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Preview Posts</h3>
                <p className="text-sm text-muted-foreground">
                  Review {parsedPosts.length} posts before importing
                </p>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {parsedPosts.map((post, index) => {
                  const title = post.frontmatter[fieldMapping.title] || "Untitled";
                  const slug = post.frontmatter[fieldMapping.slug] 
                    ? String(post.frontmatter[fieldMapping.slug])
                    : slugify(String(title));
                  const excerpt = post.frontmatter[fieldMapping.excerpt] || "";

                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{title}</h4>
                            <p className="text-sm text-muted-foreground">/{slug}</p>
                            {excerpt && (
                              <p className="text-sm text-muted-foreground mt-1">{excerpt}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && importResults && (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Import Complete</h3>
              </div>

              {importResults.success.length > 0 && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4">
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Successfully imported {importResults.success.length} posts
                      </p>
                      <ul className="mt-2 text-sm text-green-800 dark:text-green-200 space-y-1">
                        {importResults.success.map((title, i) => (
                          <li key={i}>• {title}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {importResults.errors.length > 0 && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100">
                        Failed to import {importResults.errors.length} posts
                      </p>
                      <ul className="mt-2 text-sm text-red-800 dark:text-red-200 space-y-1">
                        {importResults.errors.map((error, i) => (
                          <li key={i}>
                            • {error.title}: {error.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep > 1 && currentStep < 4 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {currentStep === 2 && (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!fieldMapping.title || !fieldMapping.slug}
            >
              Next: Preview
            </Button>
          )}
          {currentStep === 3 && (
            <Button type="button" onClick={handleImport} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsedPosts.length} Posts
            </Button>
          )}
          {currentStep === 4 && (
            <Button
              type="button"
              onClick={() => {
                handleClose();
                router.refresh();
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

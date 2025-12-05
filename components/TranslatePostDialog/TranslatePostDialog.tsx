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
import { LanguageSelector } from "@/components/LanguageSelector/LanguageSelector";
import { Label } from "@/components/ui/label";
import { translatePost } from "@/src/server/services/posts/mutations";
import { languages, getLanguageByCode } from "@/lib/languages";
import { Loader2, AlertCircle } from "lucide-react";

interface TranslatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  currentLanguage: string;
  existingLanguages: string[];
  blogId: string;
}

export function TranslatePostDialog({
  open,
  onOpenChange,
  postId,
  currentLanguage,
  existingLanguages,
  blogId,
}: TranslatePostDialogProps) {
  const router = useRouter();
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Get available languages (exclude current and existing)
  const availableLanguages = languages.filter(
    (lang) => lang.code !== currentLanguage && !existingLanguages.includes(lang.code)
  );

  function handleClose() {
    if (!isLoading) {
      setTargetLanguage("");
      setError("");
      onOpenChange(false);
    }
  }

  async function handleTranslate() {
    if (!targetLanguage) {
      setError("Please select a target language");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await translatePost(postId, targetLanguage);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Success - close dialog and refresh
        handleClose();
        router.push(`/dashboard/blogs/${blogId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to translate post");
      setIsLoading(false);
    }
  }

  const currentLangName = getLanguageByCode(currentLanguage)?.name || currentLanguage;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Translate Post</DialogTitle>
          <DialogDescription>
            Create a translated version of this post using AI. The current language is{" "}
            <strong>{currentLangName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {availableLanguages.length === 0 ? (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    All languages translated
                  </p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    This post has already been translated to all available languages.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="target-language">Target Language</Label>
                <LanguageSelector
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                  required
                  className="w-full"
                />
              </div>

              {existingLanguages.length > 0 && (
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Existing translations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingLanguages.map((langCode) => {
                      const lang = getLanguageByCode(langCode);
                      return (
                        <span
                          key={langCode}
                          className="inline-flex items-center rounded-md bg-background px-2 py-1 text-xs font-medium"
                        >
                          {lang?.name || langCode}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTranslate}
            disabled={isLoading || !targetLanguage || availableLanguages.length === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Translate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


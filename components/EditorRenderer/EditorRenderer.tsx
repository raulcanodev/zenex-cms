import type { OutputData } from "@editorjs/editorjs";
import { cn } from "@/lib/utils";
import { convertBlocksToHtml } from "@/lib/editorjs-to-html";

/** Server-rendered preview shares the public API's safe rendering rules. */
export function EditorRenderer({ data, className }: { data: OutputData; className?: string }) {
  if (!data?.blocks?.length) return <p className="text-muted-foreground">No content available.</p>;
  return <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}
    dangerouslySetInnerHTML={{ __html: convertBlocksToHtml(data) }} />;
}

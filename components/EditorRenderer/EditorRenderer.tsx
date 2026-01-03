import React, { useEffect } from "react";
import type { OutputData } from "@editorjs/editorjs";
import { cn } from "@/lib/utils";

interface EditorRendererProps {
  data: OutputData;
  className?: string;
}

interface Block {
  type: string;
  data: any;
}

export function EditorRenderer({ data, className }: EditorRendererProps) {
  useEffect(() => {
    // Load Twitter widgets after component mounts for embeds
    if (typeof window !== 'undefined' && (window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  }, [data]);

  if (!data || !data.blocks || data.blocks.length === 0) {
    return <p className="text-muted-foreground">No content available.</p>;
  }

  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      {data.blocks.map((block: Block, index: number) => (
        <div key={index} className="mb-4 last:mb-0">
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
}

function renderBlock(block: Block) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          className="mb-4 leading-7"
          dangerouslySetInnerHTML={{ __html: block.data.text || "" }}
        />
      );

    case "header":
      const level = block.data.level || 2;
      const text = block.data.text || "";
      const HeaderTag = `h${level}` as keyof React.JSX.IntrinsicElements;
      const headerClasses = {
        1: "text-4xl font-bold mb-4 mt-8",
        2: "text-3xl font-bold mb-4 mt-8",
        3: "text-2xl font-semibold mb-3 mt-6",
        4: "text-xl font-semibold mb-3 mt-6",
      };
      return (
        <HeaderTag className={headerClasses[level as keyof typeof headerClasses] || headerClasses[2]}>
          {text}
        </HeaderTag>
      );

    case "list":
      const items = block.data.items || [];
      const ListTag = block.data.style === "ordered" ? "ol" : "ul";
      const listClasses = block.data.style === "ordered" 
        ? "list-decimal list-inside mb-4 space-y-2 ml-4" 
        : "list-disc list-inside mb-4 space-y-2 ml-4";
      
      return (
        <ListTag className={listClasses}>
          {items.map((item: any, index: number) => {
            const content = typeof item === 'string' ? item : item.content || item.text || "";
            return (
              <li key={index} className="leading-7" dangerouslySetInnerHTML={{ __html: content }} />
            );
          })}
        </ListTag>
      );

    case "quote":
      return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground">
          <p className="mb-2" dangerouslySetInnerHTML={{ __html: block.data.text || "" }} />
          {block.data.caption && (
            <cite className="text-sm not-italic">— {block.data.caption}</cite>
          )}
        </blockquote>
      );

    case "code":
      return (
        <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-4">
          <code className="text-sm font-mono">{block.data.code || ""}</code>
        </pre>
      );

    case "image":
      return (
        <figure className="my-6">
          <img
            src={block.data.file?.url || block.data.url || ""}
            alt={block.data.caption || block.data.alt || ""}
            className="w-full h-auto rounded-lg"
          />
          {block.data.caption && (
            <figcaption className="text-sm text-muted-foreground mt-2 text-center">
              {block.data.caption}
            </figcaption>
          )}
        </figure>
      );

    case "linkTool":
      const linkData = block.data;
      return (
        <div className="border rounded-lg p-4 my-4 hover:bg-muted/50 transition-colors">
          {linkData.image && (
            <img
              src={linkData.image.url}
              alt={linkData.title || ""}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
          )}
          <a
            href={linkData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="font-semibold text-lg mb-1 hover:text-primary">
              {linkData.title || linkData.link}
            </h3>
            {linkData.description && (
              <p className="text-sm text-muted-foreground mb-2">{linkData.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{linkData.link}</p>
          </a>
        </div>
      );

    case "embed":
      return (
        <div className="my-6">
          <div 
            className="embed-responsive"
            dangerouslySetInnerHTML={{ __html: block.data.embed || "" }}
          />
          {block.data.caption && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {block.data.caption}
            </p>
          )}
        </div>
      );

    case "embed":
      return (
        <div className="my-6 flex justify-center">
          <div className="max-w-full w-full">
            <div 
              className="embed-container"
              dangerouslySetInnerHTML={{ __html: block.data.embed || '' }}
            />
            {block.data.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {block.data.caption}
              </p>
            )}
          </div>
        </div>
      );

    case "raw":
      return (
        <div 
          className="my-6"
          dangerouslySetInnerHTML={{ __html: block.data.html || "" }}
        />
      );

    default:
      return (
        <div className="text-muted-foreground text-sm italic">
          Unknown block type: {block.type}
        </div>
      );
  }
}


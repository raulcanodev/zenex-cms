"use client";

import { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Image from "@editorjs/image";

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
}

export function Editor({ data, onChange, placeholder }: EditorProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!holderRef.current) return;

    if (!editorRef.current) {
      editorRef.current = new EditorJS({
        holder: holderRef.current,
        placeholder: placeholder || "Start writing or use '/' for commands",
        data: data || {
          blocks: [],
        },
        tools: {
          header: {
            class: Header as any,
            config: {
              placeholder: "Enter a header",
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
            config: {
              defaultStyle: "unordered",
            },
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+O",
            config: {
              quotePlaceholder: "Enter a quote",
              captionPlaceholder: "Quote's author",
            },
          },
          code: {
            class: Code as any,
            config: {
              placeholder: "Enter code",
            },
          },
          linkTool: {
            class: LinkTool as any,
            config: {
              endpoint: "/api/link", // You'll need to create this endpoint for link previews
            },
          },
          image: {
            class: Image as any,
            config: {
              endpoints: {
                byFile: "/api/upload", // You'll need to create this endpoint for image uploads
              },
              uploader: {
                async uploadByFile(file: File) {
                  // Placeholder - implement actual upload logic
                  return {
                    success: 1,
                    file: {
                      url: URL.createObjectURL(file),
                    },
                  };
                },
              },
            },
          },
        },
        onChange: async () => {
          if (editorRef.current && onChange) {
            const outputData = await editorRef.current.save();
            onChange(outputData);
          }
        },
      });
    }

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="prose prose-sm max-w-none">
      <div ref={holderRef} className="min-h-[400px]" />
    </div>
  );
}


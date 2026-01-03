"use client";

import { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Image from "@editorjs/image";
import Table from "@editorjs/table";
import RawTool from "@editorjs/raw";
import Delimiter from "@editorjs/delimiter";

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  blogId: string;
}

export function Editor({ data, onChange, placeholder, blogId }: EditorProps) {
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Header as any,
            config: {
              placeholder: "Enter a header",
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: List as any,
            inlineToolbar: true,
            config: {
              defaultStyle: "unordered",
            },
          },
          quote: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Quote as any,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+O",
            config: {
              quotePlaceholder: "Enter a quote",
              captionPlaceholder: "Quote's author",
            },
          },
          code: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Code as any,
            config: {
              placeholder: "Enter code",
            },
          },
          table: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Table as any,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          linkTool: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: LinkTool as any,
            config: {
              endpoint: "/api/link",
            },
          },
          image: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Image as any,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  try {
                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('blogId', blogId);

                    const response = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    });

                    const data = await response.json();

                    if (!response.ok) {
                      throw new Error(data.error || 'Upload failed');
                    }

                    return data;
                  } catch (error) {
                    console.error('Image upload error:', error);
                    return {
                      success: 0,
                      error: error instanceof Error ? error.message : 'Upload failed',
                    };
                  }
                },
              },
            },
          },
          raw: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: RawTool as any,
            config: {
              placeholder: "Paste HTML embed code (Twitter, YouTube, etc.)",
            },
          },
          delimiter: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            class: Delimiter as any,
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


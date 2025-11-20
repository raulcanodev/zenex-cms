"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  title: string;
}

interface DocsTableOfContentsProps {
  sections: Section[];
}

export function DocsTableOfContents({ sections }: DocsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="hidden text-sm xl:block">
      <div className="sticky top-20 -mt-10 max-h-[calc(100vh-4rem)] overflow-y-auto pt-10">
        <div className="space-y-2">
          <p className="font-medium">On this page</p>
          <ul className="space-y-2 border-l">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "inline-block border-l-2 pl-3 text-muted-foreground transition-colors hover:text-foreground",
                    activeId === section.id
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent"
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

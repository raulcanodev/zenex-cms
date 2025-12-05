"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Next.js", href: "/docs/nextjs" },
      { title: "Astro", href: "/docs/astro" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "GET Posts", href: "/docs/api/posts" },
      { title: "GET Single Post", href: "/docs/api/post" },
      { title: "GET Categories", href: "/docs/api/categories" },
      { title: "GET Tags", href: "/docs/api/tags" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Blog Members", href: "/docs/members" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-14 z-40 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 border-r md:block md:sticky md:top-14 md:h-[calc(100vh-3.5rem)]">
      <div className="h-full overflow-y-auto py-6 pr-6 lg:py-8">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-2 text-sm font-semibold">{section.title}</h4>
              {section.items && (
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href || "#"}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                          pathname === item.href
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

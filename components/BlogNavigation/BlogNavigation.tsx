"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BlogNavigationProps {
  blogId: string;
}

export function BlogNavigation({ blogId }: BlogNavigationProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/blogs/${blogId}`;

  const navItems = [
    { href: basePath, label: "Posts", matchPath: `${basePath}/posts` },
    { href: `${basePath}/authors`, label: "Authors" },
    { href: `${basePath}/categories`, label: "Categories" },
    { href: `${basePath}/settings`, label: "Settings" },
  ];

  return (
    <nav className="border-b bg-white dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-[1000px] gap-8 px-6">
        {navItems.map((item) => {
          const checkPath = item.matchPath || item.href;
          const isActive = pathname === item.href || pathname?.startsWith(`${checkPath}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 px-1 py-4 text-sm transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


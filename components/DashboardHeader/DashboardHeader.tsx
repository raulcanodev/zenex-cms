import { getSession } from "@/lib/get-session";
import { config } from "@/data/config";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import Link from "next/link";

interface DashboardHeaderProps {
  currentBlog?: {
    name: string;
  } | null;
}

export async function DashboardHeader({ currentBlog }: DashboardHeaderProps = {}) {
  const session = await getSession();

  return (
    <header className={currentBlog ? "bg-white dark:bg-zinc-900" : "border-b bg-white dark:bg-zinc-900"}>
      <div className="mx-auto flex h-16 w-full max-w-[1000px] items-center justify-between px-6">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="font-semibold">{config.appName}</span>
        </Link>
        {currentBlog && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-sm font-medium">{currentBlog.name}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground">
            Docs
          </a>
          <ThemeToggle />
          <SignOutButton initial={session?.user?.email?.[0].toUpperCase() || "U"} />
        </div>
      </div>
    </header>
  );
}


import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface BlogCardProps {
  id: string;
  name: string;
  description?: string | null;
  postCount: number;
}

export function BlogCard({ id, name, description, postCount }: BlogCardProps) {
  return (
    <Link href={`/dashboard/blogs/${id}`}>
      <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <div>
                <CardTitle>{name}</CardTitle>
                {description && <CardDescription className="mt-1">{description}</CardDescription>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardFooter>
          <span className="text-sm text-muted-foreground">
            {postCount} {postCount === 1 ? 'post' : 'posts'}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}



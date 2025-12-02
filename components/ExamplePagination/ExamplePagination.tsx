"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ExamplePaginationProps {
  currentPage: number;
  totalPages: number;
  blogId: string;
}

export function ExamplePagination({
  currentPage,
  totalPages,
  blogId,
}: ExamplePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    params.set("blogId", blogId);
    router.push(`/example?${params.toString()}`);
  }

  if (totalPages <= 1) {
    return null;
  }

  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <Button
              variant={1 === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(1)}
              className="min-w-[2.5rem]"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(page)}
            className="min-w-[2.5rem]"
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button
              variant={totalPages === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="min-w-[2.5rem]"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}



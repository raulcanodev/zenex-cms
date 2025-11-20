import { ReactNode } from "react";

interface DocsSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function DocsSection({ id, title, children }: DocsSectionProps) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

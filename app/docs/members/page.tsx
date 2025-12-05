import { DocsLayout } from "@/components/Docs/DocsLayout";
import { DocsSidebar } from "@/components/Docs/DocsSidebar";
import { DocsSection } from "@/components/Docs/DocsSection";

export default function MembersDocsPage() {
  return (
    <DocsLayout>
      <DocsSidebar />
      <main className="relative py-6 lg:gap-10 lg:py-8">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <div className="mb-8 space-y-2">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
              Blog Members
            </h1>
            <p className="text-lg text-muted-foreground">
              Add members to your blog by email. Members can access and edit the blog.
            </p>
          </div>

          <DocsSection id="overview" title="Overview">
            <p className="mb-4 text-muted-foreground">
              Blog owners can add members by email address. When a user signs in with a member email, 
              they can access and edit the blog content.
            </p>
          </DocsSection>

          <DocsSection id="usage" title="How to Use">
            <p className="mb-4 text-muted-foreground">
              Go to your blog settings and add member emails. Only the owner can add or remove members.
            </p>
          </DocsSection>
        </div>
      </main>
    </DocsLayout>
  );
}


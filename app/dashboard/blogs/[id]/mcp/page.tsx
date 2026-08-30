import { BlogIntegrationLayout, integrationBlog } from "@/components/Integrations/BlogIntegrationLayout";
import { McpGuide } from "@/components/Integrations/McpGuide";

export default async function McpPage({ params }: { params: Promise<{ id: string }> }) {
  const { blog } = await integrationBlog((await params).id);
  return <BlogIntegrationLayout blog={blog} title="MCP" description="Connect your AI client to Zenex. Prepare content, organize your blog and publish with explicit permissions."><McpGuide dashboardId={blog.id} /></BlogIntegrationLayout>;
}

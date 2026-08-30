import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { fetchPreviewHtml } from "@/lib/link-preview";

interface LinkMeta {
  title?: string;
  description?: string;
  image?: {
    url: string;
  };
  link: string;
}

function extractMetaFromHtml(html: string, url: string): LinkMeta {
  const meta: LinkMeta = {
    link: url,
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    meta.title = ogTitleMatch[1].trim();
  }

  const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescriptionMatch) {
    meta.description = ogDescriptionMatch[1].trim();
  }

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const imageUrl = ogImageMatch[1].trim();
    // Resolve relative URLs
    try {
      const baseUrl = new URL(url);
      const imageUrlObj = new URL(imageUrl, baseUrl);
      meta.image = { url: imageUrlObj.toString() };
    } catch {
      meta.image = { url: imageUrl };
    }
  }

  // Extract standard meta tags (fallback)
  if (!meta.description) {
    const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (metaDescriptionMatch) {
      meta.description = metaDescriptionMatch[1].trim();
    }
  }

  // Extract meta image (fallback)
  if (!meta.image) {
    const metaImageMatch = html.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["']/i);
    if (metaImageMatch) {
      const imageUrl = metaImageMatch[1].trim();
      try {
        const baseUrl = new URL(url);
        const imageUrlObj = new URL(imageUrl, baseUrl);
        meta.image = { url: imageUrlObj.toString() };
      } catch {
        meta.image = { url: imageUrl };
      }
    }
  }

  // If no title found, use domain as fallback
  if (!meta.title) {
    try {
      const urlObj = new URL(url);
      meta.title = urlObj.hostname;
    } catch {
      meta.title = url;
    }
  }

  return meta;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ success: 0, error: "Unauthorized" }, { status: 401 });
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ success: 0, error: "URL parameter is required" }, { status: 400 });
  try {
    const result = await fetchPreviewHtml(url);
    return NextResponse.json({ success: 1, meta: extractMetaFromHtml(result.html, result.url) });
  } catch {
    return NextResponse.json({ success: 0, error: "Unable to preview this public HTML URL" }, { status: 400 });
  }
}

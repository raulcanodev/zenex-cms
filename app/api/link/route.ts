import { NextRequest, NextResponse } from "next/server";

interface LinkMeta {
  title?: string;
  description?: string;
  image?: {
    url: string;
  };
  link: string;
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and private IPs
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.") ||
      hostname.endsWith(".local")
    );
  } catch {
    return true;
  }
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
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      return NextResponse.json(
        { success: 0, error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Decode URL
    const url = decodeURIComponent(urlParam);

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: 0, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Check if URL is private/localhost (security)
    if (isPrivateUrl(url)) {
      return NextResponse.json(
        { success: 0, error: "Private or localhost URLs are not allowed" },
        { status: 400 }
      );
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          {
            success: 0,
            error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      // Limit response size (first 500KB)
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return NextResponse.json(
          {
            success: 0,
            error: "URL does not return HTML content",
          },
          { status: 400 }
        );
      }

      const html = await response.text();
      const limitedHtml = html.substring(0, 500000); // Limit to 500KB

      // Extract metadata
      const meta = extractMetaFromHtml(limitedHtml, url);

      // Return in Editor.js LinkTool format
      return NextResponse.json({
        success: 1,
        meta,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return NextResponse.json(
          { success: 0, error: "Request timeout" },
          { status: 408 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Error fetching link metadata:", error);
    return NextResponse.json(
      {
        success: 0,
        error: error instanceof Error ? error.message : "Failed to fetch link metadata",
      },
      { status: 500 }
    );
  }
}





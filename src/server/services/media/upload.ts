import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL, getBlogUploadPath, getPublicUrl } from "@/lib/r2";
import { ApiError } from "@/lib/integrations/errors";

export function imageExtension(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (mimeType === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return "jpg";
  if (mimeType === "image/gif" && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))) return "gif";
  if (mimeType === "image/webp" && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  throw new ApiError(400, "File signature must match JPEG, PNG, GIF or WebP; SVG is not supported");
}

/** Callers authorize the blog before invoking this shared storage adapter. */
export async function uploadBlogImage(blogId: string, bytes: Buffer, mimeType: string, maxBytes = 10 * 1024 * 1024) {
  if (!bytes.length || bytes.length > maxBytes) throw new ApiError(413, "Image exceeds the allowed size");
  const extension = imageExtension(bytes, mimeType);
  if (!R2_BUCKET_NAME || !R2_PUBLIC_URL || !process.env.R2_ENDPOINT) throw new ApiError(503, "Media storage is not configured");
  const path = getBlogUploadPath(blogId, `${randomUUID()}.${extension}`);
  await r2Client.send(new PutObjectCommand({ Bucket: R2_BUCKET_NAME, Key: path, Body: bytes, ContentType: mimeType, ContentDisposition: "inline" }));
  return { url: getPublicUrl(path), size: bytes.length, mimeType };
}

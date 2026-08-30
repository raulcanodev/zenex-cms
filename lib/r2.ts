import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
// R2 is S3-compatible, so we use the AWS SDK
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Get the upload path for a blog
 */
export function getBlogUploadPath(blogId: string, filename: string): string {
  return `blogs/${blogId}/${filename}`;
}

/**
 * Get the public URL for an uploaded file
 */
export function getPublicUrl(path: string): string {
  return `${R2_PUBLIC_URL}/${path}`;
}

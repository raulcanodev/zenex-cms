import { getSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/integrations/errors";
import { checkOrigin, errorResponse, privateJson } from "@/lib/integrations/http";
import { uploadBlogImage } from "@/src/server/services/media/upload";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const session = await getSession();
    if (!session?.user?.id) throw new ApiError(401, "Unauthorized");
    // Bound multipart parsing even when Content-Length is missing/untrusted.
    const limit = 11 * 1024 * 1024;
    if (Number(request.headers.get("content-length")) > limit) throw new ApiError(413, "Upload too large");
    let size = 0;
    const stream = request.body?.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > limit) throw new ApiError(413, "Upload too large");
        controller.enqueue(chunk);
      },
    }));
    if (!stream) throw new ApiError(400, "Upload required");
    const formData = await new Response(stream, { headers: request.headers }).formData();
    const file = formData.get("image");
    const blogId = formData.get("blogId");
    if (!(file instanceof File) || typeof blogId !== "string") throw new ApiError(400, "Image and blogId required");
    const email = session.user.email?.trim().toLowerCase();
    const blog = await prisma.blog.findFirst({ where: { id: blogId, OR: [
      { userId: session.user.id }, ...(email ? [{ members: { some: { userEmail: email } } }] : []),
    ] }, select: { id: true } });
    if (!blog) throw new ApiError(403, "No access to this blog");
    const result = await uploadBlogImage(blog.id, Buffer.from(await file.arrayBuffer()), file.type === "image/jpg" ? "image/jpeg" : file.type);
    return privateJson({ success: 1, file: { ...result, name: file.name } });
  } catch (error) { return errorResponse(error); }
}


const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.MEDIA) {
      return json({
        success: false,
        error: "R2 storage unavailable."
      }, 503);
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return json({
        success: false,
        error: "กรุณาส่งไฟล์แบบ FormData"
      }, 415);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return json({
        success: false,
        error: "กรุณาเลือกไฟล์รูปภาพ"
      }, 400);
    }

    const extension = ALLOWED_TYPES[file.type];

    if (!extension) {
      return json({
        success: false,
        error: "รองรับเฉพาะ JPG, PNG และ WebP"
      }, 400);
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return json({
        success: false,
        error: "รูปภาพต้องมีขนาดไม่เกิน 5 MB"
      }, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    const isJpeg =
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    const isPng =
      bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10]
        .every((value, index) => bytes[index] === value);

    const isWebp =
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

    if (
      (file.type === "image/jpeg" && !isJpeg) ||
      (file.type === "image/png" && !isPng) ||
      (file.type === "image/webp" && !isWebp)
    ) {
      return json({
        success: false,
        error: "ไฟล์รูปภาพไม่ถูกต้อง"
      }, 400);
    }

    const key = `articles/${crypto.randomUUID()}.${extension}`;

    await env.MEDIA.put(key, bytes, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable"
      }
    });

    return json({
      success: true,
      message: "อัปโหลดรูปภาพสำเร็จ",
      key,
      url: `/api/articles/image/${key.split("/").pop()}`
    }, 201);

  } catch (error) {
    console.error("Article image upload error:", error);

    return json({
      success: false,
      error: "ไม่สามารถอัปโหลดรูปภาพได้"
    }, 500);
  }
}

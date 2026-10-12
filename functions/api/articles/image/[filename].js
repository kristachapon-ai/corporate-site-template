
export async function onRequestGet({ env, params }) {
  try {
    if (!env.MEDIA) {
      return new Response("Storage unavailable", {
        status: 503
      });
    }

    const filename = params.filename;

    if (
      typeof filename !== "string" ||
      !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)
    ) {
      return new Response("Invalid filename", {
        status: 400
      });
    }

    const key = `articles/${filename}`;

    const object = await env.MEDIA.get(key);

    if (!object) {
      return new Response("Image not found", {
        status: 404
      });
    }

    const extension = filename.split(".").pop().toLowerCase();

    const contentTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp"
    };

    const headers = new Headers();

    headers.set(
      "Content-Type",
      contentTypes[extension]
    );

    headers.set(
      "Cache-Control",
      "public, max-age=3600"
    );

    headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Article image error:", error);

    return new Response("Unable to load image", {
      status: 500
    });
  }
}


function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable"
      }, 503);
    }

    const result = await env.DB.prepare(`
      SELECT
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        cover_image_alt
      FROM articles
      WHERE status = 'published'
      ORDER BY id DESC
      LIMIT 50
    `).all();

    return json({
      success: true,
      articles: result.results || []
    });

  } catch (error) {
    console.error("Public articles API error:", error);

    return json({
      success: false,
      error: "Unable to load articles"
    }, 500);
  }
}

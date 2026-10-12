
function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function validSlug(slug) {
  return typeof slug === "string" &&
    slug.length <= 200 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function onRequestGet({ env, params }) {
  try {
    const slug = params.slug;

    if (!validSlug(slug)) {
      return json({
        success: false,
        error: "Invalid article slug."
      }, 400);
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable."
      }, 503);
    }

  
    const article = await env.DB.prepare(`
      SELECT
        id,
        title,
        slug,
        excerpt,
        content,
        cover_image_url,
        cover_image_alt,
        seo_title,
        meta_description,
        focus_keyword,
        author_name,
        author_position,
        author_avatar_url,
        published_at,
        updated_at
      FROM articles
      WHERE slug = ?
        AND status = 'published'
      LIMIT 1
    `)
      .bind(slug)
      .first();


    if (!article) {
      return json({
        success: false,
        error: "Article not found."
      }, 404);
    }

    return json({
      success: true,
      article
    });

  } catch (error) {
    console.error("Public article detail error:", error);

    return json({
      success: false,
      error: "Unable to load article."
    }, 500);
  }
}

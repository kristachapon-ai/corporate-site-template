
const MAX_CONTENT_LENGTH = 200000;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function clean(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function validSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function getArticleId(params) {
  const value = String(params.id ?? "");

  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) ? id : null;
}

export async function onRequestGet({ env, params }) {
  try {
    const id = getArticleId(params);

    if (!id) {
      return json({
        success: false,
        error: "Invalid article ID."
      }, 400);
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable."
      }, 503);
    }

    const article = await env.DB.prepare(
      "SELECT * FROM articles WHERE id = ? LIMIT 1"
    )
      .bind(id)
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
    console.error("Get article error:", error);

    return json({
      success: false,
      error: "Unable to load article."
    }, 500);
  }
}

export async function onRequestPut({ request, env, params }) {
  try {
    const id = getArticleId(params);

    if (!id) {
      return json({
        success: false,
        error: "Invalid article ID."
      }, 400);
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable."
      }, 503);
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return json({
        success: false,
        error: "Content-Type must be application/json."
      }, 415);
    }

    const rawBody = await request.text();

    if (rawBody.length > 250000) {
      return json({
        success: false,
        error: "Request body too large."
      }, 413);
    }

    let body;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return json({
        success: false,
        error: "Invalid JSON."
      }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({
        success: false,
        error: "Invalid article data."
      }, 400);
    }

    const article = {
      title: clean(body.title, 200),
      slug: clean(body.slug, 200),
      excerpt: clean(body.excerpt, 1000),
      content: clean(body.content, MAX_CONTENT_LENGTH),
      cover_image_url: clean(body.cover_image_url, 1000),
      cover_image_alt: clean(body.cover_image_alt, 300),
      seo_title: clean(body.seo_title, 70),
      meta_description: clean(body.meta_description, 160),
      
      focus_keyword: clean(body.focus_keyword, 200),
      author_name: clean(body.author_name, 150) || "Admin",
      author_position: clean(body.author_position, 200),
      author_avatar_url: clean(body.author_avatar_url, 1000),
      status: clean(body.status, 20)

    };

    if (!article.title) {
      return json({
        success: false,
        error: "กรุณากรอกชื่อบทความ"
      }, 400);
    }

    if (!validSlug(article.slug)) {
      return json({
        success: false,
        error: "URL Slug ไม่ถูกต้อง"
      }, 400);
    }

    if (!["draft", "published"].includes(article.status)) {
      return json({
        success: false,
        error: "สถานะบทความไม่ถูกต้อง"
      }, 400);
    }

    if (String(body.content ?? "").length > MAX_CONTENT_LENGTH) {
      return json({
        success: false,
        error: "เนื้อหาบทความยาวเกินกำหนด"
      }, 400);
    }

    if (article.status === "published" && !article.content) {
      return json({
        success: false,
        error: "กรุณาใส่เนื้อหาก่อนเผยแพร่"
      }, 400);
    }

    const existing = await env.DB.prepare(
      "SELECT id, published_at FROM articles WHERE id = ? LIMIT 1"
    )
      .bind(id)
      .first();

    if (!existing) {
      return json({
        success: false,
        error: "ไม่พบบทความ"
      }, 404);
    }

    const duplicate = await env.DB.prepare(
      "SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1"
    )
      .bind(article.slug, id)
      .first();

    if (duplicate) {
      return json({
        success: false,
        error: "URL Slug นี้ถูกใช้งานแล้ว"
      }, 409);
    }

    await env.DB.prepare(`
      UPDATE articles SET
        title = ?,
        slug = ?,
        excerpt = ?,
        content = ?,
        cover_image_url = ?,
        cover_image_alt = ?,
        seo_title = ?,
        meta_description = ?,
        focus_keyword = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP,
        published_at = CASE
          WHEN ? = 'published'
          THEN COALESCE(published_at, CURRENT_TIMESTAMP)
          ELSE published_at
        END
      WHERE id = ?
    `)
      .bind(
        article.title,
        article.slug,
        article.excerpt,
        article.content,
        article.cover_image_url,
        article.cover_image_alt,
        article.seo_title,
        article.meta_description,
        article.focus_keyword,
        article.status,
        article.status,
        id
      )
      .run();

    return json({
      success: true,
      message: "แก้ไขบทความสำเร็จ",
      id,
      slug: article.slug,
      status: article.status
    });

  } catch (error) {
    console.error("Update article error:", error);

    if (String(error.message || "").includes("UNIQUE constraint failed")) {
      return json({
        success: false,
        error: "URL Slug นี้ถูกใช้งานแล้ว"
      }, 409);
    }

    return json({
      success: false,
      error: "Unable to update article."
    }, 500);
  }
}


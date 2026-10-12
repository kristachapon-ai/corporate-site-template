
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

function validateArticle(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid article data.";
  }

  const title = clean(body.title, 200);
  const slug = clean(body.slug, 200);
  const status = clean(body.status, 20);

  if (!title) {
    return "กรุณากรอกชื่อบทความ";
  }

  if (!validSlug(slug)) {
    return "URL Slug ต้องใช้ตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และขีดกลางเท่านั้น";
  }

  if (!["draft", "published"].includes(status)) {
    return "สถานะบทความไม่ถูกต้อง";
  }

  if (String(body.content ?? "").length > MAX_CONTENT_LENGTH) {
    return "เนื้อหาบทความยาวเกินกำหนด";
  }

  if (status === "published" && !clean(body.content, MAX_CONTENT_LENGTH)) {
    return "กรุณาใส่เนื้อหาก่อนเผยแพร่";
  }

  return null;
}

function articleValues(body) {
  return {
    title: clean(body.title, 200),
    slug: clean(body.slug, 200),
    excerpt: clean(body.excerpt, 1000),
    content: clean(body.content, MAX_CONTENT_LENGTH),
    cover_image_url: clean(body.cover_image_url, 1000),
    cover_image_alt: clean(body.cover_image_alt, 300),
    seo_title: clean(body.seo_title, 70),
    meta_description: clean(body.meta_description, 160),
    focus_keyword: clean(body.focus_keyword, 200),
    status: clean(body.status, 20)
  };
}

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB) {
      return json({
        success: false,
        error: "Database unavailable."
      }, 503);
    }

    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page"));

    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 100000)
      : 1;

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM articles"
    ).first();

    const total = Number(count?.total || 0);

    const result = await env.DB.prepare(`
      SELECT
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        status,
        created_at,
        updated_at,
        published_at
      FROM articles
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?
    `)
      .bind(pageSize, offset)
      .all();

    return json({
      success: true,
      articles: result.results || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  } catch (error) {
    console.error("List articles error:", error);

    return json({
      success: false,
      error: "Unable to load articles."
    }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
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

    const validationError = validateArticle(body);

    if (validationError) {
      return json({
        success: false,
        error: validationError
      }, 400);
    }

    const article = articleValues(body);

    const existing = await env.DB.prepare(
      "SELECT id FROM articles WHERE slug = ? LIMIT 1"
    )
      .bind(article.slug)
      .first();

    if (existing) {
      return json({
        success: false,
        error: "URL Slug นี้ถูกใช้งานแล้ว"
      }, 409);
    }

    const result = await env.DB.prepare(`
      INSERT INTO articles (
        title,
        slug,
        excerpt,
        content,
        cover_image_url,
        cover_image_alt,
        seo_title,
        meta_description,
        focus_keyword,
        status,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        CASE WHEN ? = 'published'
          THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
      )
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
        article.status
      )
      .run();

    return json({
      success: true,
      message: "บันทึกบทความสำเร็จ",
      id: result.meta?.last_row_id,
      slug: article.slug,
      status: article.status
    }, 201);

  } catch (error) {
    console.error("Create article error:", error);

    if (
      String(error.message || "").includes("UNIQUE constraint failed")
    ) {
      return json({
        success: false,
        error: "URL Slug นี้ถูกใช้งานแล้ว"
      }, 409);
    }

    return json({
      success: false,
      error: "Unable to save article."
    }, 500);
  }
}

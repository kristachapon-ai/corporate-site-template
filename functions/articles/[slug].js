
const SITE_URL = "https://www.ngthailand.com";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderContent(content) {
  const lines = String(content || "").split(/\r?\n/);
  const html = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const line of lines) {
    const text = line.trim();

    if (!text) {
      closeList();
      continue;
    }

    if (/^###\s+/.test(text)) {
      closeList();
      html.push(`<h3>${escapeHtml(text.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(text)) {
      closeList();
      html.push(`<h2>${escapeHtml(text.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(text)) {
      closeList();
      // The article title is already rendered as H1.
      html.push(`<h2>${escapeHtml(text.replace(/^#\s+/, ""))}</h2>`);
    } else if (/^[-*]\s+/.test(text)) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(text.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (/^---+$/.test(text)) {
      closeList();
      html.push("<hr>");
    } else {
      closeList();
      html.push(`<p>${escapeHtml(text)}</p>`);
    }
  }

  closeList();
  return html.join("\n");
}

export async function onRequestGet({ env, params }) {
  const slug = String(params.slug || "");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) {
    return new Response("Article not found", { status: 404 });
  }

  if (!env.DB) {
    return new Response("Database unavailable", { status: 503 });
  }

  let article;

  try {
    article = await env.DB.prepare(`
      SELECT title, slug, excerpt, content,
             cover_image_url, cover_image_alt,
             seo_title, meta_description, published_at
      FROM articles
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `).bind(slug).first();
  } catch (error) {
    console.error("Article page error:", error);
    return new Response("Unable to load article", { status: 500 });
  }

  if (!article) {
    return new Response("Article not found", { status: 404 });
  }

  const title = escapeHtml(article.title);
  const seoTitle = escapeHtml(article.seo_title || article.title);
  const description = escapeHtml(
    article.meta_description || article.excerpt || ""
  );
  const cover = article.cover_image_url || "";
  const safeCover = escapeHtml(
    cover.startsWith("/api/articles/image/")
      ? SITE_URL + cover
      : ""
  );
  const canonical = `${SITE_URL}/articles/${encodeURIComponent(slug)}`;
  const publishedDate = article.published_at
    ? String(article.published_at).slice(0, 10)
    : "";

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${seoTitle} | NG Training</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  ${safeCover ? `<meta property="og:image" content="${safeCover}">` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/variables.css">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--color-background-soft);
      color: var(--color-text);
      font-family: var(--font-primary);
    }
    .header {
      background: var(--color-primary);
      padding: 24px 6%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }
    .brand {
      color: #fff;
      text-decoration: none;
      font: 800 19px var(--font-heading);
      letter-spacing: 2px;
    }
    .brand span { color: var(--color-accent); }
    .back { color: #fff; text-decoration: none; font-size: 13px; }
    .article {
      max-width: 900px;
      margin: 60px auto 90px;
      padding: 0 24px;
    }
    .eyebrow {
      color: var(--color-accent);
      font: 800 12px var(--font-heading);
      letter-spacing: 2px;
    }
    h1 {
      font-family: var(--font-primary);
      font-size: clamp(30px, 4vw, 52px);
      line-height: 1.35;
      margin: 20px 0;
    }
    .excerpt {
      color: var(--color-text-muted);
      font-size: 18px;
      line-height: 1.9;
    }
    .cover {
      width: 100%;
      height: auto;
      display: block;
      margin: 36px 0;
    }
    .content {
      font-size: 17px;
      line-height: 2;
      overflow-wrap: anywhere;
    }
    .content h2 {
      font-size: 26px;
      line-height: 1.5;
      margin: 42px 0 16px;
    }
    .content h3 { font-size: 21px; margin-top: 30px; }
    .content p { margin: 0 0 20px; }
    .content li { margin-bottom: 10px; }
    .content hr { border: 0; border-top: 1px solid #ddd; margin: 35px 0; }
    .cta {
      margin-top: 60px;
      background: var(--color-primary);
      color: #fff;
      padding: 35px;
    }
    .cta h2 { margin-top: 0; font-size: 24px; }
    .cta a {
      display: inline-block;
      background: var(--color-accent);
      color: #fff;
      padding: 13px 24px;
      text-decoration: none;
      font-weight: 700;
    }
    footer {
      padding: 30px;
      text-align: center;
      background: var(--color-primary);
      color: #bbb;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <header class="header">
    <a class="brand" href="/">NG <span>TRAINING</span></a>
    <a class="back" href="/articles/">← บทความทั้งหมด</a>
  </header>
  <main>
    <article class="article">
      <div class="eyebrow">NG TRAINING | INSIGHTS</div>
      <h1>${title}</h1>
      ${publishedDate ? `<time datetime="${escapeHtml(publishedDate)}">${escapeHtml(publishedDate)}</time>` : ""}
      <p class="excerpt">${escapeHtml(article.excerpt)}</p>
      ${safeCover ? `<img class="cover" src="${safeCover}" alt="${escapeHtml(article.cover_image_alt || article.title)}">` : ""}
      <div class="content">${renderContent(article.content)}</div>
      <section class="cta">
        <h2>พัฒนาทีมของคุณกับ NG Training</h2>
        <p>พูดคุยกับเราเพื่อออกแบบกิจกรรม Team Building ให้เหมาะกับองค์กร</p>
        <a href="/#contact">ติดต่อ NG Training →</a>
      </section>
    </article>
  </main>
  <footer>© NG Training. All rights reserved.</footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

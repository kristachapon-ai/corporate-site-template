
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
             seo_title, meta_description,
             author_name, author_position, author_avatar_url,
             published_at

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

  const publishedDateTime = article.published_at
    ? String(article.published_at).replace(" ", "T") + "Z"
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
  
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || article.excerpt || "",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical
    },
    ...(safeCover ? { image: [safeCover] } : {}),
    ...(publishedDateTime ? { datePublished: publishedDateTime } : {}),
    author: {
      "@type": "Organization",
      name: "NG Training",
      url: SITE_URL
    },
    publisher: {
      "@type": "Organization",
      name: "NG Training",
      url: SITE_URL
    }
  }).replace(/</g, "\\u003c")}
  </script>

  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/variables.css">
  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #ffffff;
      color: var(--color-text);
      font-family: var(--font-primary);
      -webkit-font-smoothing: antialiased;
    }

    .header {
      background: var(--color-primary);
      padding: 20px max(24px, calc((100% - 1100px) / 2));
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .brand {
      color: #ffffff;
      text-decoration: none;
      font-family: var(--font-heading);
      font-size: 21px;
      font-weight: 800;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .brand span {
      color: var(--color-accent);
    }

    .back {
      color: #ffffff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }

    .back:hover {
      color: var(--color-accent);
    }

    .article {
      max-width: 1100px;
      margin: 0 auto;
      padding: 42px 24px 70px;
    }

    .eyebrow {
      color: var(--color-accent);
      font-family: var(--font-heading);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    h1 {
      font-family: var(--font-primary);
      font-size: clamp(30px, 4vw, 48px);
      font-weight: 700;
      line-height: 1.35;
      margin: 12px 0;
    }

    .excerpt {
      color: var(--color-text-muted);
      font-size: 17px;
      line-height: 1.8;
      margin: 10px 0;
    }

    .article time {
      display: block;
      margin: 12px 0 22px;
      color: #888888;
      font-size: 13px;
    }

    .cover {
      width: 100%;
      aspect-ratio: 1200 / 630;
      object-fit: cover;
      display: block;
      margin: 28px 0 32px;
      border-radius: 8px;
    }

    .content {
      font-size: 16px;
      line-height: 1.95;
      overflow-wrap: anywhere;
    }

    .content h2 {
      position: relative;
      font-family: var(--font-primary);
      font-size: clamp(22px, 3vw, 28px);
      font-weight: 700;
      line-height: 1.5;
      margin: 38px 0 14px;
      padding-left: 24px;
    }

    .content h2::before {
      content: "";
      position: absolute;
      left: 0;
      top: 9px;
      width: 10px;
      height: 22px;
      background: var(--color-accent);
      transform: skew(-24deg);
    }

    .content h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 28px 0 12px;
    }

    .content p {
      margin: 0 0 18px;
    }

    .content ul {
      list-style: none;
      padding: 0;
      margin: 16px 0 28px;
    }

    .content li {
      position: relative;
      padding-left: 29px;
      margin-bottom: 10px;
    }

    .content li::before {
      content: "✓";
      position: absolute;
      left: 0;
      top: 5px;
      width: 19px;
      height: 19px;
      border-radius: 50%;
      background: var(--color-accent);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      line-height: 19px;
      text-align: center;
    }

    .content hr {
      border: 0;
      border-top: 1px solid var(--color-border);
      margin: 35px 0;
    }

    .cta {
      margin-top: 55px;
      background: var(--color-primary);
      color: #ffffff;
      padding: 35px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .cta h2 {
      margin: 0 0 8px;
      font-size: 25px;
      line-height: 1.4;
    }

    .cta p {
      margin: 0;
      font-size: 14px;
      line-height: 1.8;
      color: #eeeeee;
    }

    .cta a {
      display: inline-block;
      flex-shrink: 0;
      background: var(--color-accent);
      color: #ffffff;
      padding: 14px 24px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      transition: background .2s ease;
    }

    .cta a:hover {
      background: var(--color-accent-hover);
    }

    footer {
      padding: 30px 24px;
      text-align: center;
      background: var(--color-primary);
      color: #bbbbbb;
      font-size: 12px;
    }

    @media (max-width: 700px) {
      .header {
        padding: 18px 20px;
      }

      .brand {
        font-size: 17px;
      }

      .article {
        padding: 32px 20px 55px;
      }

      h1 {
        font-size: 30px;
      }

      .excerpt {
        font-size: 15px;
      }

      .content {
        font-size: 15px;
      }

      .content h2 {
        padding-left: 20px;
      }

      .cover {
        margin: 24px 0;
      }

      .cta {
        padding: 28px 24px;
        flex-direction: column;
        align-items: flex-start;
      }

      .cta h2 {
        font-size: 22px;
      }

      .cta a {
        width: 100%;
        text-align: center;
      }
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
        <div>
          <h2>พัฒนาทีมของคุณกับ NG Training</h2>
          <p>
            พูดคุยกับเราเพื่อออกแบบกิจกรรม Team Building
            ให้เหมาะกับองค์กรของคุณ
          </p>
        </div>

        <a href="/#contact">
          ติดต่อ NG Training →
        </a>
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

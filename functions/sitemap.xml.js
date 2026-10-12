
const SITE_URL = "https://www.ngthailand.com";

function escapeXml(value) {
  return String(value ?? "").replace(/[<>&"']/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
}

function urlEntry(path, lastmod = "") {
  const location = escapeXml(SITE_URL + path);

  return `  <url>
    <loc>${location}</loc>${lastmod ? `
    <lastmod>${escapeXml(lastmod)}</lastmod>` : ""}
  </url>`;
}

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return new Response("Database unavailable", {
      status: 503
    });
  }

  try {
    const result = await env.DB.prepare(`
      SELECT slug, updated_at, published_at
      FROM articles
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all();

    const entries = [
      urlEntry("/"),
      urlEntry("/articles/")
    ];

    for (const article of result.results || []) {
      const slug = String(article.slug || "");

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        continue;
      }

      const dateValue =
        article.updated_at || article.published_at || "";

      const lastmod = /^\d{4}-\d{2}-\d{2}/.test(dateValue)
        ? dateValue.slice(0, 10)
        : "";

      entries.push(
        urlEntry(
          `/articles/${encodeURIComponent(slug)}`,
          lastmod
        )
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff"
      }
    });

  } catch (error) {
    console.error("Sitemap error:", error);

    return new Response("Unable to generate sitemap", {
      status: 500
    });
  }
}


document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById(
    "articles-container"
  );

  if (!container) return;

  function showMessage(message) {
    container.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.className = "notice";
    paragraph.textContent = message;

    container.appendChild(paragraph);
  }

  function createArticleCard(article) {
    const card = document.createElement("a");
    card.className = "article-card";
    card.href = `/articles/${encodeURIComponent(article.slug)}`;

    if (article.cover_image_url) {
      const image = document.createElement("img");
      image.className = "article-image";
      image.src = article.cover_image_url;
      image.alt =
        article.cover_image_alt ||
        article.title ||
        "NG Training article";

      image.loading = "lazy";
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "article-body";

    const category = document.createElement("div");
    category.className = "article-category";
    category.textContent = "NG TRAINING | INSIGHTS";

    const title = document.createElement("h2");
    title.className = "article-title";
    title.textContent = article.title || "";

    const excerpt = document.createElement("p");
    excerpt.className = "article-excerpt";
    excerpt.textContent = article.excerpt || "";

    const readMore = document.createElement("span");
    readMore.className = "read-more";
    readMore.textContent = "อ่านบทความ →";

    body.append(
      category,
      title,
      excerpt,
      readMore
    );

    card.appendChild(body);

    return card;
  }

  showMessage("กำลังโหลดบทความ...");

  try {
    const response = await fetch("/api/articles/", {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load articles");
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.articles)) {
      throw new Error("Invalid articles response");
    }

    container.replaceChildren();

    if (result.articles.length === 0) {
      showMessage("ยังไม่มีบทความที่เผยแพร่");
      return;
    }

    result.articles.forEach((article) => {
      container.appendChild(createArticleCard(article));
    });

  } catch (error) {
    console.error("Public articles error:", error);

    showMessage(
      "ไม่สามารถโหลดบทความได้ในขณะนี้"
    );
  }
});

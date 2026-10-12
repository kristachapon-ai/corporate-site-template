
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("home-insights-grid");

  if (!container) return;

  function showMessage(message) {
    container.replaceChildren();

    const paragraph = document.createElement("p");
    paragraph.className = "home-insights-message";
    paragraph.textContent = message;

    container.appendChild(paragraph);
  }

  function createCard(article) {
    const card = document.createElement("a");
    card.className = "home-insight-card";
    card.href = `/articles/${encodeURIComponent(article.slug)}`;

    if (article.cover_image_url) {
      const image = document.createElement("img");
      image.className = "home-insight-image";
      image.src = article.cover_image_url;
      image.alt = article.cover_image_alt || article.title || "บทความ NG Training";
      image.loading = "lazy";
      card.appendChild(image);
    }

    const body = document.createElement("div");
    body.className = "home-insight-body";

    const category = document.createElement("span");
    category.className = "home-insight-category";
    category.textContent = "NG TRAINING | INSIGHTS";

    const title = document.createElement("h3");
    title.className = "home-insight-card-title";
    title.textContent = article.title || "";

    const excerpt = document.createElement("p");
    excerpt.className = "home-insight-excerpt";
    excerpt.textContent = article.excerpt || "";

    const readMore = document.createElement("span");
    readMore.className = "home-insight-read";
    readMore.textContent = "อ่านบทความ ↗";

    body.append(category, title, excerpt, readMore);
    card.appendChild(body);

    return card;
  }

  showMessage("กำลังโหลดบทความล่าสุด...");

  try {
    const response = await fetch("/api/articles/", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("Unable to load articles");

    const result = await response.json();

    if (!result.success || !Array.isArray(result.articles)) {
      throw new Error("Invalid articles response");
    }

    const articles = result.articles.slice(0, 3);

    container.replaceChildren();

    if (articles.length === 0) {
      showMessage("ยังไม่มีบทความที่เผยแพร่");
      return;
    }

    articles.forEach((article) => {
      container.appendChild(createCard(article));
    });

  } catch (error) {
    console.error("Homepage articles error:", error);
    showMessage("ไม่สามารถโหลดบทความได้ในขณะนี้");
  }
});

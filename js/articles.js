
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("article-list-content");

  if (!container) return;

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showMessage(title, description) {
    container.className = "article-empty";
    container.innerHTML = `
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    `;
  }

  showMessage("กำลังโหลดบทความ...", "กรุณารอสักครู่");

  try {
    const response = await fetch("/api/admin/articles/", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });

    if (response.status === 401) {
      window.location.href = "/admin-login.html";
      return;
    }

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.articles)) {
      throw new Error(result.error || "Invalid API response");
    }

    if (result.articles.length === 0) {
      showMessage(
        "ยังไม่มีบทความ",
        "กดเพิ่มบทความใหม่เพื่อเริ่มสร้างเนื้อหา SEO"
      );
      return;
    }

    container.className = "article-list-content";

    container.innerHTML = result.articles.map((article) => {
      const published = article.status === "published";

      return `
        <div class="article-data-row"
          style="
            display:grid;
            grid-template-columns:minmax(0,1fr) 130px 110px;
            gap:20px;
            align-items:center;
            padding:22px 24px;
            border-bottom:1px solid #e5e5e5;
          ">

          <div style="min-width:0;">
            <strong style="
              display:block;
              overflow-wrap:anywhere;
              font-size:15px;
            ">
              ${escapeHTML(article.title)}
            </strong>

            <small style="
              color:#777;
              overflow-wrap:anywhere;
            ">
              ${escapeHTML(article.slug)}
            </small>
          </div>

          <div>
            <span style="
              display:inline-block;
              padding:7px 12px;
              background:${published ? "#e8f7ed" : "#f1f1f1"};
              color:${published ? "#167347" : "#555"};
              font-size:12px;
              font-weight:700;
            ">
              ${published ? "PUBLISHED" : "DRAFT"}
            </span>
          </div>

          <div>
            <span style="font-size:12px;color:#777;">
              ID: ${escapeHTML(article.id)}
            </span>
          </div>

        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Load SEO articles error:", error);

    showMessage(
      "ไม่สามารถโหลดบทความได้",
      "กรุณาตรวจสอบการเชื่อมต่อ API และ Cloudflare D1"
    );
  }
});
อ

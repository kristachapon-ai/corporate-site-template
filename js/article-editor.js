
document.addEventListener("DOMContentLoaded", () => {
  const field = (id) => document.getElementById(id);

  const saveButton = document.getElementById("save-draft-button");
  const publishButton = document.getElementById("publish-article-button");
  const messageBox = document.getElementById("article-save-message");

  if (!saveButton || !publishButton || !messageBox) {
    console.error("Article editor controls are missing.");
    return;
  }

  function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.color = isError ? "#b42318" : "#167347";
    messageBox.hidden = false;
  }

  function getValue(id) {
    return field(id)?.value.trim() || "";
  }

  function getArticleData(status) {
    return {
      title: getValue("article-title"),
      slug: getValue("article-slug"),
      excerpt: getValue("article-excerpt"),
      content: getValue("article-content"),
      cover_image_url: "",
      cover_image_alt: getValue("article-cover-alt"),
      seo_title: getValue("article-seo-title"),
      meta_description: getValue("article-meta-description"),
      focus_keyword: getValue("article-keyword"),
      status
    };
  }

  let saving = false;
  let savedArticleId = null;

  async function saveArticle(status) {
    if (saving) return;

    const article = getArticleData(status);

    if (!article.title) {
      showMessage("กรุณากรอกชื่อบทความ", true);
      field("article-title").focus();
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
      showMessage("กรุณากรอก URL Slug เป็นภาษาอังกฤษตัวเล็กและขีดกลาง", true);
      field("article-slug").focus();
      return;
    }

    if (status === "published" && !article.content) {
      showMessage("กรุณากรอกเนื้อหาก่อนเผยแพร่", true);
      field("article-content").focus();
      return;
    }

    if (savedArticleId !== null) {
      showMessage(
        "บทความนี้บันทึกแล้ว กรุณาเปิดหน้ารายการบทความก่อนสร้างรายการใหม่",
        true
      );
      return;
    }

    const selectedCover = field("article-cover")?.files?.[0];

    if (selectedCover) {
      showMessage(
        "ยังไม่รองรับการอัปโหลดภาพ กรุณานำภาพออกก่อนบันทึก",
        true
      );
      return;
    }

    saving = true;
    saveButton.disabled = true;
    publishButton.disabled = true;

    showMessage("กำลังบันทึกบทความ...");

    try {
      const response = await fetch("/api/admin/articles/", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(article)
      });

      if (response.status === 401) {
        showMessage("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", true);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "ไม่สามารถบันทึกบทความได้");
      }

      savedArticleId = result.id;

      showMessage(
        status === "published"
          ? "บันทึกสถานะ Published สำเร็จ (ยังไม่มีหน้าเว็บบทความสาธารณะ)"
          : "บันทึกฉบับร่างสำเร็จ"
      );

      field("article-status").value = status;

      saveButton.textContent = "SAVED";
      publishButton.textContent = "SAVED";

    } catch (error) {
      console.error("Article save error:", error);
      showMessage(error.message, true);
    } finally {
      saving = false;

      if (savedArticleId === null) {
        saveButton.disabled = false;
        publishButton.disabled = false;
      }
    }
  }

  saveButton.addEventListener("click", () => {
    saveArticle("draft");
  });

  publishButton.addEventListener("click", () => {
    saveArticle("published");
  });
});

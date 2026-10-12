
document.addEventListener("DOMContentLoaded", async () => {
  const field = (id) => document.getElementById(id);

  const saveButton = field("save-draft-button");
  const publishButton = field("publish-article-button");
  const messageBox = field("article-save-message");

  if (!saveButton || !publishButton || !messageBox) {
    console.error("Article editor controls are missing.");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");
  const isEditMode = idParam !== null;
  const articleId = isEditMode ? Number(idParam) : null;

  let saving = false;
  let loading = false;
  let savedArticleId = null;
  let currentCoverUrl = "";
  let currentAuthorAvatarUrl = "";


  function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.color = isError ? "#b42318" : "#167347";
    messageBox.hidden = false;
  }

  function getValue(id) {
    return field(id)?.value.trim() || "";
  }

  function setValue(id, value) {
    const element = field(id);
    if (element) element.value = value ?? "";
  }

  function setButtonsDisabled(disabled) {
    saveButton.disabled = disabled;
    publishButton.disabled = disabled;
  }

  function getArticleData(status) {
    return {
      title: getValue("article-title"),
      slug: getValue("article-slug"),
      excerpt: getValue("article-excerpt"),
      content: getValue("article-content"),
      cover_image_url: currentCoverUrl,
      cover_image_alt: getValue("article-cover-alt"),
      seo_title: getValue("article-seo-title"),
      meta_description: getValue("article-meta-description"),
      focus_keyword: getValue("article-keyword"),
      author_name: getValue("article-author-name") || "Admin",
      author_position: getValue("article-author-position"),
      author_avatar_url: currentAuthorAvatarUrl,

      status

    };
  }

  async function loadArticle() {
    if (!Number.isSafeInteger(articleId) || articleId <= 0) {
      showMessage("รหัสบทความไม่ถูกต้อง", true);
      setButtonsDisabled(true);
      return;
    }

    loading = true;
    setButtonsDisabled(true);
    showMessage("กำลังโหลดข้อมูลบทความ...");

    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}`,
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (response.status === 401) {
        window.location.href = "/admin/login.html";
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success || !result.article) {
        throw new Error(
          result.error || "ไม่สามารถโหลดบทความได้"
        );
      }

      const article = result.article;

      setValue("article-title", article.title);
      setValue("article-slug", article.slug);
      setValue("article-excerpt", article.excerpt);
      setValue("article-content", article.content);
      setValue("article-cover-alt", article.cover_image_alt);
      setValue("article-seo-title", article.seo_title);
      setValue("article-meta-description", article.meta_description);
      setValue("article-keyword", article.focus_keyword);
      
      setValue("article-author-name", article.author_name || "Admin");
      setValue("article-author-position", article.author_position);

      currentAuthorAvatarUrl = article.author_avatar_url || "";

      const authorPreview = field("article-author-avatar-preview");

      if (authorPreview) {
        if (currentAuthorAvatarUrl) {
          authorPreview.src = currentAuthorAvatarUrl;
          authorPreview.hidden = false;
        } else {
          authorPreview.removeAttribute("src");
          authorPreview.hidden = true;
        }
      }

      setValue("article-status", article.status);

      currentCoverUrl = article.cover_image_url || "";

      const preview = field("article-cover-preview");
      if (preview && currentCoverUrl) {
        preview.src = currentCoverUrl;
      }

      showMessage("โหลดบทความเดิมสำเร็จ สามารถแก้ไขได้แล้ว");

    } catch (error) {
      console.error("Load article error:", error);
      showMessage(error.message, true);
      return;
    } finally {
      loading = false;
    }

    setButtonsDisabled(false);
  }

  async function saveArticle(status) {
    if (saving || loading) return;

    const article = getArticleData(status);

    if (!article.title) {
      showMessage("กรุณากรอกชื่อบทความ", true);
      field("article-title")?.focus();
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) {
      showMessage(
        "กรุณากรอก URL Slug เป็นภาษาอังกฤษตัวเล็กและขีดกลาง",
        true
      );
      field("article-slug")?.focus();
      return;
    }

    if (status === "published" && !article.content) {
      showMessage("กรุณากรอกเนื้อหาก่อนเผยแพร่", true);
      field("article-content")?.focus();
      return;
    }

    
const selectedCover = field("article-cover")?.files?.[0];

if (selectedCover) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(selectedCover.type)) {
    showMessage("รองรับเฉพาะ JPG, PNG และ WebP", true);
    return;
  }

  if (selectedCover.size > 5 * 1024 * 1024) {
    showMessage("รูปภาพต้องมีขนาดไม่เกิน 5 MB", true);
    return;
  }
}


    if (!isEditMode && savedArticleId !== null) {
      showMessage(
        "บทความนี้บันทึกแล้ว กรุณากลับไปที่รายการบทความเพื่อแก้ไข",
        true
      );
      return;
    }

    saving = true;
    setButtonsDisabled(true);
    showMessage("กำลังบันทึกบทความ...");

    try {
      
if (selectedCover) {
  showMessage("กำลังอัปโหลดภาพบทความ...");

  const formData = new FormData();
  formData.append("file", selectedCover);

  const uploadResponse = await fetch(
    "/api/admin/articles/upload",
    {
      method: "POST",
      credentials: "same-origin",
      body: formData
    }
  );

  if (uploadResponse.status === 401) {
    throw new Error(
      "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"
    );
  }

  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadResult.success) {
    throw new Error(
      uploadResult.error || "อัปโหลดภาพไม่สำเร็จ"
    );
  }

  if (
    typeof uploadResult.url !== "string" ||
    !uploadResult.url.startsWith("/api/articles/image/")
  ) {
    throw new Error("API ส่ง URL ภาพไม่ถูกต้อง");
  }

  currentCoverUrl = uploadResult.url;
  article.cover_image_url = currentCoverUrl;

  const preview = field("article-cover-preview");

  if (preview) {
    preview.src = currentCoverUrl;
  }
}

showMessage("กำลังบันทึกข้อมูลบทความ...");

      const url = isEditMode
        ? `/api/admin/articles/${articleId}`
        : "/api/admin/articles/";

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(article)
      });

      if (response.status === 401) {
        showMessage("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", true);
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "ไม่สามารถบันทึกบทความได้"
        );
      }

      savedArticleId = result.id;

      setValue("article-status", status);

      showMessage(
  status === "published"
    ? "เผยแพร่บทความสำเร็จ สามารถเปิดอ่านบนเว็บไซต์ได้แล้ว"
    : "บันทึกฉบับร่างสำเร็จ"
);

      if (!isEditMode) {
        saveButton.textContent = "SAVED";
        publishButton.textContent = "SAVED";
      }

    } catch (error) {
      console.error("Article save error:", error);
      showMessage(error.message, true);
    } finally {
      saving = false;

      if (isEditMode || savedArticleId === null) {
        setButtonsDisabled(false);
      }
    }
  }

  saveButton.addEventListener("click", () => {
    saveArticle("draft");
  });

  publishButton.addEventListener("click", () => {
    saveArticle("published");
  });

  if (isEditMode) {
    await loadArticle();
  }
});

      

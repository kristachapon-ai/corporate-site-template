document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quote-form");

  if (!form) return;

  const submitButton = form.querySelector(".quote-submit");

  if (!submitButton) return;

  let reviewModal = null;

  function getValue(name) {
    const field = form.elements[name];

    if (!field) return "-";

    const value = String(field.value || "").trim();

    return value || "-";
  }

  function getSelectText(name) {
    const field = form.elements[name];

    if (!field || field.selectedIndex < 0) return "-";

    const option = field.options[field.selectedIndex];

    if (!option || !option.value) {
      return "ยังไม่ได้ระบุ";
    }

    return option.textContent.trim();
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function row(label, value) {
    return `
      <div class="quote-review-row">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
      </div>
    `;
  }

  function buildReviewModal() {
    const contactName = getValue("contactName");
    const position = getValue("position");
    const organization = getValue("organization");
    const email = getValue("email");
    const phone = getValue("phone");
    const lineId = getValue("lineId");

    const eventType = getSelectText("eventType");
    const duration = getSelectText("duration");
    const eventDate = formatDate(getValue("eventDate"));
    const venue = getValue("venue");
    const participants = getValue("participants");
    const budget = getSelectText("budget");
    const objectives = getValue("objectives");
    const eventNote = getValue("eventNote");

    const legalName = getValue("legalName");
    const taxId = getValue("taxId");
    const branch = getValue("branch");
    const quotationAddress = getValue("quotationAddress");
    const district = getValue("district");
    const area = getValue("area");
    const province = getValue("province");
    const postalCode = getValue("postalCode");
    const quotationEmail = getValue("quotationEmail");
    const documentContact = getValue("documentContact");

    const modal = document.createElement("div");

    modal.className = "quote-review-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "quote-review-title");

    modal.innerHTML = `
      <div class="quote-review-backdrop"></div>

      <div class="quote-review-panel">

        <div class="quote-review-top">
          <div>
            <p>REVIEW YOUR REQUEST</p>

            <h2 id="quote-review-title">
              ตรวจสอบข้อมูล<br>
              <span>ก่อนส่งคำขอ</span>
            </h2>
          </div>

          <button
            class="quote-review-close"
            type="button"
            aria-label="ปิดหน้าตรวจสอบ"
          >
            ×
          </button>
        </div>


        <div class="quote-review-content">

          <section class="quote-review-group">
            <p class="quote-review-label">
              01 / CONTACT PERSON
            </p>

            ${row("ชื่อ–นามสกุล", contactName)}
            ${row("ตำแหน่ง", position)}
            ${row("บริษัท / หน่วยงาน", organization)}
            ${row("อีเมล", email)}
            ${row("โทรศัพท์", phone)}
            ${row("LINE ID", lineId)}
          </section>


          <section class="quote-review-group">
            <p class="quote-review-label">
              02 / EVENT BRIEF
            </p>

            ${row("ประเภทกิจกรรม", eventType)}
            ${row("ระยะเวลา", duration)}
            ${row("วันที่จัดงาน", eventDate)}
            ${row("สถานที่", venue)}
            ${row("จำนวนผู้เข้าร่วม", `${participants} คน`)}
            ${row("งบประมาณ", budget)}
            ${row("วัตถุประสงค์", objectives)}
            ${row("รายละเอียดเพิ่มเติม", eventNote)}
          </section>


          <section class="quote-review-group">
            <p class="quote-review-label">
              03 / QUOTATION INFORMATION
            </p>

            ${row("ชื่อนิติบุคคล / หน่วยงาน", legalName)}
            ${row("เลขประจำตัวผู้เสียภาษี", taxId)}
            ${row("สำนักงานใหญ่ / สาขา", branch)}
            ${row("ที่อยู่", quotationAddress)}
            ${row("แขวง / ตำบล", district)}
            ${row("เขต / อำเภอ", area)}
            ${row("จังหวัด", province)}
            ${row("รหัสไปรษณีย์", postalCode)}
            ${row("อีเมลรับใบเสนอราคา", quotationEmail)}
            ${row("ผู้รับเอกสาร / ฝ่าย", documentContact)}
          </section>

        </div>


        <div class="quote-review-actions">

          <button
            class="quote-review-edit"
            type="button"
          >
            ← EDIT INFORMATION
          </button>

          <button
            class="quote-review-confirm"
            type="button"
          >
            CONFIRM & SUBMIT
            <span>→</span>
          </button>

        </div>

      </div>
    `;

    return modal;
  }

  function closeReview() {
    if (!reviewModal) return;

    document.body.classList.remove("quote-review-open");

    reviewModal.remove();
    reviewModal = null;
  }

  function openReview() {
    reviewModal = buildReviewModal();

    document.body.appendChild(reviewModal);
    document.body.classList.add("quote-review-open");

    const closeButton =
      reviewModal.querySelector(".quote-review-close");

    const editButton =
      reviewModal.querySelector(".quote-review-edit");

    const confirmButton =
      reviewModal.querySelector(".quote-review-confirm");

    const backdrop =
      reviewModal.querySelector(".quote-review-backdrop");

    closeButton.addEventListener("click", closeReview);
    editButton.addEventListener("click", closeReview);
    backdrop.addEventListener("click", closeReview);

     confirmButton.addEventListener("click", async () => {
      if (confirmButton.disabled) return;

      const originalHTML = confirmButton.innerHTML;

      const payload = {
        contactName: form.elements["contactName"].value.trim(),
        position: form.elements["position"].value.trim(),
        organization: form.elements["organization"].value.trim(),
        email: form.elements["email"].value.trim(),
        phone: form.elements["phone"].value.trim(),
        lineId: form.elements["lineId"].value.trim(),

        eventType: form.elements["eventType"].value,
        duration: form.elements["duration"].value,
        eventDate: form.elements["eventDate"].value,
        venue: form.elements["venue"].value.trim(),
        participants: form.elements["participants"].value,
        budget: form.elements["budget"].value,
        objectives: form.elements["objectives"].value.trim(),
        eventNote: form.elements["eventNote"].value.trim(),

        legalName: form.elements["legalName"].value.trim(),
        taxId: form.elements["taxId"].value.trim(),
        branch: form.elements["branch"].value.trim(),
        quotationAddress: form.elements["quotationAddress"].value.trim(),
        district: form.elements["district"].value.trim(),
        area: form.elements["area"].value.trim(),
        province: form.elements["province"].value.trim(),
        postalCode: form.elements["postalCode"].value.trim(),
        quotationEmail: form.elements["quotationEmail"].value.trim(),
        documentContact: form.elements["documentContact"].value.trim()
      };

      confirmButton.disabled = true;
      confirmButton.textContent = "SUBMITTING...";

      try {
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error || "Unable to submit quote request."
          );
        }

        confirmButton.textContent =
          `SUBMITTED — ${result.requestNumber}`;

        editButton.disabled = true;
        closeButton.disabled = true;

        form.reset();
      } catch (error) {
        console.error("Quote submission error:", error);

        confirmButton.disabled = false;
        confirmButton.innerHTML = originalHTML;

        alert(
          "ไม่สามารถส่งคำขอใบเสนอราคาได้ กรุณาลองใหม่อีกครั้ง"
        );
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    openReview();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reviewModal) {
      closeReview();
    }
  });
});

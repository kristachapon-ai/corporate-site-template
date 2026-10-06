document.addEventListener("DOMContentLoaded", () => {
  const requestNumberElement =
    document.getElementById("detail-request-number");

  const statusElement =
    document.getElementById("detail-status");
const statusSelect =
  document.getElementById("quote-status");

const updateStatusButton =
  document.getElementById("update-status-button");
  const contentElement =
    document.getElementById("quote-detail-content");

  if (
    !requestNumberElement ||
    !statusElement ||
    !contentElement
  ) {
    return;
  }


  function escapeHTML(value) {
    return String(value ?? "-")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function displayValue(value) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return "-";
    }

    return String(value).trim();
  }


  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }


  function formatDateTime(value) {
    if (!value) return "-";

    const normalizedValue =
      String(value).includes("T")
        ? value
        : `${value.replace(" ", "T")}Z`;

    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }


  function formatStatus(status) {
  if (status === "new") {
    return "NEW — ยังไม่ได้ทำ";
  }

  if (status === "quoting") {
    return "QUOTING — กำลังทำ";
  }

  if (status === "sent") {
    return "SENT — ส่งแล้ว";
  }

  if (status === "follow_up") {
    return "FOLLOW UP — รอติดตาม";
  }

  if (status === "closed") {
    return "CLOSED — ปิดงาน";
  }

    return String(status || "-").toUpperCase();
  }


  function detailRow(label, value) {
    return `
      <div class="admin-detail-row">
        <span>${escapeHTML(label)}</span>

        <strong>
          ${escapeHTML(displayValue(value))}
        </strong>
      </div>
    `;
  }

  function formatQuotationAddress(quote) {
    const parts = [];

    if (quote.quotation_address) {
      parts.push(
        String(quote.quotation_address).trim()
      );
    }

    if (quote.district) {
      parts.push(
        `ต.${String(quote.district).trim()}`
      );
    }

    if (quote.area) {
      parts.push(
        `อ.${String(quote.area).trim()}`
      );
    }

    if (quote.province) {
      parts.push(
        `จ.${String(quote.province).trim()}`
      );
    }

    if (quote.postal_code) {
      parts.push(
        String(quote.postal_code).trim()
      );
    }

    return parts.length
      ? parts.join(" ")
      : "-";
  }

  
  function renderQuote(quote) {
    requestNumberElement.textContent =
      quote.request_number || "-";

    statusElement.textContent =
      formatStatus(quote.status);
    statusElement.className =
  `quote-status-badge status-${quote.status || "new"}`;
      if (statusSelect) {
  statusSelect.value = quote.status || "new";
}

    contentElement.innerHTML = `
      <section class="admin-detail-group">

        <div class="admin-detail-group-heading">
          <span>01</span>

          <div>
            <p>CONTACT PERSON</p>
            <h3>ข้อมูลผู้ติดต่อ</h3>
          </div>
        </div>

        <div class="admin-detail-grid">
          ${detailRow(
            "ชื่อ–นามสกุล",
            quote.contact_name
          )}

          ${detailRow(
            "ตำแหน่ง",
            quote.position
          )}

          ${detailRow(
            "บริษัท / หน่วยงาน",
            quote.organization
          )}

          ${detailRow(
            "อีเมล",
            quote.email
          )}

          ${detailRow(
            "โทรศัพท์",
            quote.phone
          )}

          ${detailRow(
            "LINE ID",
            quote.line_id
          )}
        </div>

      </section>


      <section class="admin-detail-group">

        <div class="admin-detail-group-heading">
          <span>02</span>

          <div>
            <p>EVENT BRIEF</p>
            <h3>รายละเอียดกิจกรรม</h3>
          </div>
        </div>

        <div class="admin-detail-grid">
          ${detailRow(
            "ประเภทกิจกรรม",
            quote.event_type
          )}

          ${detailRow(
            "ระยะเวลา",
            quote.duration
          )}

          ${detailRow(
            "วันที่จัดงาน",
            formatDate(quote.event_date)
          )}

          ${detailRow(
            "สถานที่",
            quote.venue
          )}

          ${detailRow(
            "จำนวนผู้เข้าร่วม",
            quote.participants
              ? `${quote.participants} คน`
              : "-"
          )}

          ${detailRow(
            "งบประมาณ",
            quote.budget
          )}
        </div>

        <div class="admin-detail-wide">
          ${detailRow(
            "วัตถุประสงค์ / หัวข้อที่ต้องการ",
            quote.objectives
          )}

          ${detailRow(
            "รายละเอียดเพิ่มเติม",
            quote.event_note
          )}
        </div>

      </section>


           <section class="admin-detail-group">

        <div class="admin-detail-group-heading">
          <span>03</span>

          <div>
            <p>QUOTATION INFORMATION</p>
            <h3>ข้อมูลสำหรับออกใบเสนอราคา</h3>
          </div>
        </div>

        <div class="admin-detail-grid">

          ${detailRow(
            "ชื่อนิติบุคคล / หน่วยงาน",
            quote.legal_name
          )}

          ${detailRow(
            "เลขประจำตัวผู้เสียภาษี",
            quote.tax_id
          )}

          ${detailRow(
            "สำนักงานใหญ่ / สาขา",
            quote.branch
          )}

          ${detailRow(
            "ผู้รับเอกสาร / ฝ่าย",
            quote.document_contact
          )}

        </div>

        <div class="admin-detail-wide">

          ${detailRow(
            "ที่อยู่สำหรับออกใบเสนอราคา",
            formatQuotationAddress(quote)
          )}

          ${detailRow(
            "อีเมลรับใบเสนอราคา",
            quote.quotation_email
          )}

        </div>

      </section>


      <section class="admin-detail-group">

        <div class="admin-detail-group-heading">
          <span>04</span>

          <div>
            <p>REQUEST INFORMATION</p>
            <h3>ข้อมูลระบบ</h3>
          </div>
        </div>

        <div class="admin-detail-grid">
          ${detailRow(
            "Request ID",
            quote.id
          )}

          ${detailRow(
            "Request Number",
            quote.request_number
          )}

          ${detailRow(
            "Status",
            formatStatus(quote.status)
          )}

          ${detailRow(
            "วันที่รับคำขอ",
            formatDateTime(quote.created_at)
          )}
        </div>

      </section>
    `;
  }


  async function loadQuoteDetail() {
    const params =
      new URLSearchParams(window.location.search);

    const id = params.get("id");

    if (!id) {
      requestNumberElement.textContent =
        "INVALID REQUEST";

      contentElement.innerHTML = `
        <p>
          ไม่พบหมายเลขคำขอใบเสนอราคา
        </p>
      `;

      return;
    }

    try {
      const response = await fetch(
        `/api/admin/detail?id=${encodeURIComponent(id)}`,
        {
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
          "Unable to load quote request."
        );
      }

      renderQuote(result.quote);
    } catch (error) {
      console.error(
        "Admin quote detail loading error:",
        error
      );

      requestNumberElement.textContent =
        "LOAD ERROR";

      statusElement.textContent = "ERROR";

      contentElement.innerHTML = `
        <p>
          ไม่สามารถโหลดรายละเอียดคำขอใบเสนอราคาได้
        </p>
      `;
    }
  }

if (updateStatusButton && statusSelect) {
  updateStatusButton.addEventListener("click", async () => {
    const id = new URLSearchParams(
      window.location.search
    ).get("id");

    if (!id) {
      alert("ไม่พบ Quote Request ID");
      return;
    }

    updateStatusButton.disabled = true;
    updateStatusButton.textContent = "UPDATING...";

    try {
      const response = await fetch(
        `/api/admin/detail?id=${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            status: statusSelect.value
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Unable to update status."
        );
      }

      statusElement.textContent =
        formatStatus(result.status);
      statusElement.className =
  `quote-status-badge status-${result.status}`;

      alert("อัปเดตสถานะเรียบร้อยแล้ว");
    } catch (error) {
      console.error(
        "Quote status update error:",
        error
      );

      alert(
        "ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่"
      );
    } finally {
      updateStatusButton.disabled = false;
      updateStatusButton.textContent =
        "UPDATE STATUS";
    }
  });
}
  loadQuoteDetail();
});

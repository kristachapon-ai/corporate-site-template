document.addEventListener("DOMContentLoaded", () => {
  const summaryCards = document.querySelectorAll(
    ".admin-summary article strong"
  );

  const tableBody = document.querySelector(
    ".admin-table tbody"
  );
    const paginationInfo = document.querySelector(
    "#pagination-info"
  );

  const paginationPages = document.querySelector(
    "#pagination-pages"
  );

  const paginationPrev = document.querySelector(
    "#pagination-prev"
  );

  const paginationNext = document.querySelector(
    "#pagination-next"
  );

  let currentPage = 1;

  if (!tableBody) return;


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }
function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
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

  function updateSummary(summary) {
  if (summaryCards.length < 5) return;

  summaryCards[0].textContent =
    summary.new ?? 0;

  summaryCards[1].textContent =
    summary.quoting ?? 0;

  summaryCards[2].textContent =
    summary.sent ?? 0;

  summaryCards[3].textContent =
    summary.followUp ?? 0;

  summaryCards[4].textContent =
    summary.closed ?? 0;
}


  function renderRequests(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
      tableBody.innerHTML = `
        <tr>
         <td colspan="8">
            ยังไม่มีคำขอใบเสนอราคา
          </td>
        </tr>
      `;

      return;
    }

    tableBody.innerHTML = requests
      .map((request) => {
        return `
          <tr>
            <td>
              <strong>
                ${escapeHTML(request.request_number)}
              </strong>
            </td>

            <td>
              <strong>
                ${escapeHTML(request.organization)}
              </strong>
              <br>
              <span>
                ${escapeHTML(request.contact_name)}
              </span>
            </td>

            <td>
              ${escapeHTML(request.event_type)}
            </td>

            <td>
              ${escapeHTML(
                formatDate(request.event_date)
              )}
            </td>
              <td>
  ${escapeHTML(
    formatDateTime(request.created_at)
  )}
</td>
            <td>
              ${escapeHTML(request.participants)} คน
            </td>
      
            <td>
  <span
    class="quote-status-badge status-${escapeHTML(
      request.status || "new"
    )}"
  >
    ${escapeHTML(
      formatStatus(request.status)
    )}
  </span>
</td>

            <td>
  <a
    href="/admin/quote.html?id=${encodeURIComponent(request.id)}"
    class="admin-table-link"
    aria-label="เปิดคำขอ ${escapeHTML(request.request_number)}"
  >
    →
  </a>
</td>
          </tr>
        `;
      })
      .join("");
  }

    function renderPagination(pagination) {
    if (
      !paginationInfo ||
      !paginationPages ||
      !paginationPrev ||
      !paginationNext
    ) {
      return;
    }

    const page = pagination.page || 1;
    const pageSize = pagination.pageSize || 10;
    const total = pagination.total || 0;
    const totalPages = pagination.totalPages || 1;

    const start =
      total === 0
        ? 0
        : (page - 1) * pageSize + 1;

    const end = Math.min(
      page * pageSize,
      total
    );

    paginationInfo.textContent =
      `Showing ${start}–${end} of ${total} requests`;

    paginationPrev.disabled = page <= 1;
    paginationNext.disabled = page >= totalPages;

    paginationPages.innerHTML = "";

    for (let i = 1; i <= totalPages; i += 1) {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = i;

      if (i === page) {
        button.classList.add("is-active");
        button.disabled = true;
      }

      button.addEventListener("click", () => {
        loadQuoteRequests(i);
      });

      paginationPages.appendChild(button);
    }
  }
    async function loadQuoteRequests(page = currentPage) {
    try {
      const response = await fetch(
                `/api/admin/quotes?page=${encodeURIComponent(page)}`,
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
          "Unable to load quote requests."
        );
      }
      updateSummary(result.summary);
      renderRequests(result.requests);   
      currentPage = result.pagination.page;
      renderPagination(result.pagination);
    } catch (error) {
      console.error(
        "Admin quote loading error:",
        error
      );

      tableBody.innerHTML = `
        <tr>
         <td colspan="8">
            ไม่สามารถโหลดข้อมูลคำขอใบเสนอราคาได้
          </td>
        </tr>
      `;
    }
  }

    if (paginationPrev) {
    paginationPrev.addEventListener("click", () => {
      if (currentPage > 1) {
        loadQuoteRequests(currentPage - 1);
      }
    });
  }

  if (paginationNext) {
    paginationNext.addEventListener("click", () => {
      loadQuoteRequests(currentPage + 1);
    });
  }
  const logoutButton = document.querySelector(
    "#admin-logout-button"
  );

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "LOGGING OUT...";

      try {
        const response = await fetch(
          "/api/admin/logout",
          {
            method: "POST",
            headers: {
              "Accept": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error("Logout failed.");
        }

        window.location.href = "/admin-login.html";
      } catch (error) {
        console.error("Admin logout error:", error);

        logoutButton.disabled = false;
        logoutButton.textContent = "LOGOUT";

        alert("ไม่สามารถออกจากระบบได้ กรุณาลองใหม่");
      }
    });
  }


  loadQuoteRequests();
});

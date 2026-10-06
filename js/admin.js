document.addEventListener("DOMContentLoaded", () => {
  const summaryCards = document.querySelectorAll(
    ".admin-summary article strong"
  );

  const tableBody = document.querySelector(
    ".admin-table tbody"
  );

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
      return "NEW";
    }

    if (status === "in_progress") {
      return "IN PROGRESS";
    }

    if (status === "completed") {
      return "COMPLETED";
    }

    return String(status || "-").toUpperCase();
  }


  function updateSummary(summary) {
    if (summaryCards.length < 3) return;

    summaryCards[0].textContent =
      summary.new ?? 0;

    summaryCards[1].textContent =
      summary.inProgress ?? 0;

    summaryCards[2].textContent =
      summary.completed ?? 0;
  }


  function renderRequests(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
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
              ${escapeHTML(
                formatStatus(request.status)
              )}
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


  async function loadQuoteRequests() {
    try {
      const response = await fetch(
        "/api/admin/quotes",
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
    } catch (error) {
      console.error(
        "Admin quote loading error:",
        error
      );

      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            ไม่สามารถโหลดข้อมูลคำขอใบเสนอราคาได้
          </td>
        </tr>
      `;
    }
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

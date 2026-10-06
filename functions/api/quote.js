export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          error: "Database binding is not available."
        },
        500
      );
    }

    const data = await request.json();

    const requiredFields = [
      "contactName",
      "organization",
      "email",
      "phone",
      "eventType",
      "duration",
      "eventDate",
      "venue",
      "participants",
      "legalName",
      "quotationAddress",
      "quotationEmail"
    ];

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        String(data[field]).trim() === ""
      ) {
        return jsonResponse(
          {
            success: false,
            error: `Missing required field: ${field}`
          },
          400
        );
      }
    }

    const participants = Number.parseInt(data.participants, 10);

    if (!Number.isInteger(participants) || participants < 1) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid participant count."
        },
        400
      );
    }

    const requestNumber = createRequestNumber();

    const result = await env.DB.prepare(`
      INSERT INTO quote_requests (
        request_number,
        contact_name,
        position,
        organization,
        email,
        phone,
        line_id,
        event_type,
        duration,
        event_date,
        venue,
        participants,
        budget,
        objectives,
        event_note,
        legal_name,
        tax_id,
        branch,
        quotation_address,
        district,
        area,
        province,
        postal_code,
        quotation_email,
        document_contact,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?
      )
    `)
      .bind(
        requestNumber,
        clean(data.contactName),
        clean(data.position),
        clean(data.organization),
        clean(data.email),
        clean(data.phone),
        clean(data.lineId),
        clean(data.eventType),
        clean(data.duration),
        clean(data.eventDate),
        clean(data.venue),
        participants,
        clean(data.budget),
        clean(data.objectives),
        clean(data.eventNote),
        clean(data.legalName),
        clean(data.taxId),
        clean(data.branch),
        clean(data.quotationAddress),
        clean(data.district),
        clean(data.area),
        clean(data.province),
        clean(data.postalCode),
        clean(data.quotationEmail),
        clean(data.documentContact),
        "new"
      )
      .run();

    if (!result.success) {
      throw new Error("Unable to save quote request.");
    }

    return jsonResponse(
      {
        success: true,
        requestNumber,
        message: "Quote request submitted successfully."
      },
      201
    );
  } catch (error) {
    console.error("Quote API error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to submit quote request."
      },
      500
    );
  }
}


export function onRequestGet() {
  return jsonResponse(
    {
      success: false,
      error: "Method not allowed."
    },
    405
  );
}


function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();

  return cleaned === "" ? null : cleaned;
}


function createRequestNumber() {
  const now = new Date();

  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("");

  const uniquePart = crypto.randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();

  return `NGQ-${date}-${uniquePart}`;
}


function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

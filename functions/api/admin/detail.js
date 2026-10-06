export async function onRequestGet(context) {
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

    const url = new URL(request.url);

    const id = Number.parseInt(
      url.searchParams.get("id"),
      10
    );

    if (!Number.isInteger(id) || id < 1) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid quote request ID."
        },
        400
      );
    }

    const quote = await env.DB.prepare(`
      SELECT
        id,
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

        status,
        created_at,
        updated_at

      FROM quote_requests

      WHERE id = ?

      LIMIT 1
    `)
      .bind(id)
      .first();

    if (!quote) {
      return jsonResponse(
        {
          success: false,
          error: "Quote request not found."
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      quote
    });
  } catch (error) {
    console.error(
      "Admin quote detail API error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error: "Unable to load quote request."
      },
      500
    );
  }
}


function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

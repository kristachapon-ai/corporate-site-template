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

    const pageParam = Number.parseInt(
      url.searchParams.get("page"),
      10
    );

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const countResult = await env.DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
        SUM(CASE WHEN status = 'quoting' THEN 1 ELSE 0 END) AS quoting_count,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS sent_count,
        SUM(CASE WHEN status = 'follow_up' THEN 1 ELSE 0 END) AS follow_up_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count
      FROM quote_requests
    `).first();

    const total = Number(countResult?.total || 0);
    const totalPages = Math.max(
      1,
      Math.ceil(total / pageSize)
    );

    const result = await env.DB.prepare(`
      SELECT
        id,
        request_number,
        contact_name,
        organization,
        event_type,
        event_date,
        participants,
        status,
        created_at
      FROM quote_requests
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
      .bind(pageSize, offset)
      .all();

    const requests = result.results || [];

    const summary = {
      new: Number(countResult?.new_count || 0),
      quoting: Number(countResult?.quoting_count || 0),
      sent: Number(countResult?.sent_count || 0),
      followUp: Number(
        countResult?.follow_up_count || 0
      ),
      closed: Number(countResult?.closed_count || 0)
    };

    return jsonResponse({
      success: true,
      summary,
      requests,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error("Admin quote API error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Unable to load quote requests."
      },
      500
    );
  }
}
export function onRequestPost() {
  return jsonResponse(
    {
      success: false,
      error: "Method not allowed."
    },
    405
  );
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

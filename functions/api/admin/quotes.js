export async function onRequestGet(context) {
  try {
    const { env } = context;

    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          error: "Database binding is not available."
        },
        500
      );
    }

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
    `).all();

    const requests = result.results || [];

    const summary = {
      new: 0,
      inProgress: 0,
      completed: 0
    };

    for (const request of requests) {
      if (request.status === "new") {
        summary.new += 1;
      } else if (request.status === "in_progress") {
        summary.inProgress += 1;
      } else if (request.status === "completed") {
        summary.completed += 1;
      }
    }

    return jsonResponse({
      success: true,
      summary,
      requests
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

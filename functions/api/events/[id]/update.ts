import {validatePartialEventData} from "../../utils/event-validation";
import {validateEventAccess, isEventAuthError} from "../../utils/event-auth";
import {jsonResponse, errorResponse} from "../../utils/response";
import type {RequestContext} from "@shared/cloudflare-types";
import type {UpdateEventRequest} from "@shared/types";

export async function onRequest(context: RequestContext) {
  if (context.request.method !== "PUT") {
    return errorResponse("Method not allowed", 405);
  }

  try {

    // 🆕：3行で同じ処理！
    const authResult = await validateEventAccess(context, "edit");
    if (isEventAuthError(authResult)) {
      return authResult;
    }

    const {event, eventId, client} = authResult;

    const body: UpdateEventRequest = await context.request.json();

    // 部分バリデーション
    const validationErrors = validatePartialEventData(body);
    if (validationErrors.length > 0) {
      return errorResponse(validationErrors.join(", "), 400);
    }

    // 更新実行（固定SQL - create.tsと同じパターン）
    await client.execute({
      sql: `UPDATE events 
            SET title = ?, date = ?, location = ?, description = ?, image_url = ?, capacity = ?
            WHERE id = ?`,
      args: [
        body.title ?? String(event.title),
        body.date ?? String(event.date),
        body.location ?? String(event.location),
        body.description ?? String(event.description || ""),
        body.image_url ?? (event.image_url ? String(event.image_url) : null),
        body.capacity ?? (event.capacity ? Number(event.capacity) : null),
        eventId,
      ],
    });

    // 更新後のイベント情報を取得
    const updatedEvent = await client.execute({
      sql: "SELECT * FROM events WHERE id = ?",
      args: [eventId],
    });

    return jsonResponse({
      message: "イベントが更新されました",
      eventId,
      event: updatedEvent.rows[0],
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return errorResponse("イベントの更新中にエラーが発生しました", 500);
  }
}
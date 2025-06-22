import {validateRequest, isValidationError} from "../../utils/validation";
import {UpdateEventSchema} from "../../../../shared/schemas";
import {validateEventAccess, isEventAuthError} from "../../utils/event-auth";
import {jsonResponse, errorResponse} from "../../utils/response";
import type {RequestContext} from "../../../../shared/cloudflare-types";

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

    const body = await context.request.json();

    // 🆕 Zodバリデーション使用（UpdateEventSchema = partial）
    const validatedData = validateRequest(UpdateEventSchema, body);
    if (isValidationError(validatedData)) {
      return validatedData; // バリデーションエラーレスポンスをそのまま返す
    }

    // 🔧 UpdateEventSchemaのpartial特性：提供されたフィールドのみが含まれる
    const {title, date, location, description, image_url, capacity} =
      validatedData;

    // 空のオブジェクトチェック（partialスキーマの特殊対応）
    if (Object.keys(validatedData).length === 0) {
      return jsonResponse({
        message: "更新する項目がありませんでした",
        eventId,
        event: event, // 既存のイベント情報をそのまま返す
      });
    }

    // 更新実行（固定SQL - create.tsと同じパターン）
    await client.execute({
      sql: `UPDATE events 
            SET title = ?, date = ?, location = ?, description = ?, image_url = ?, capacity = ?
            WHERE id = ?`,
      args: [
        title ?? String(event.title),
        date ?? String(event.date),
        location ?? String(event.location),
        description ?? String(event.description || ""),
        image_url ?? (event.image_url ? String(event.image_url) : null),
        capacity ?? (event.capacity ? Number(event.capacity) : null),
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

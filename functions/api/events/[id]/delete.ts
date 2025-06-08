import {validateEventAccess, isEventAuthError} from "../../utils/event-auth";
import {jsonResponse, errorResponse} from "../../utils/response";
import type {RequestContext} from "@shared/cloudflare-types";

export async function onRequest(context: RequestContext) {
  if (context.request.method !== "DELETE") {
    return errorResponse("Method not allowed", 405);
  }

  try {
   
    // 🆕：3行で同じ処理！
    const authResult = await validateEventAccess(context, "delete");
    if (isEventAuthError(authResult)) {
      return authResult;
    }

    const {eventId, client} = authResult;

    // 参加者がいるかチェック
    const attendeeCount = await client.execute({
      sql: "SELECT COUNT(*) as count FROM attendees WHERE event_id = ?",
      args: [eventId],
    });

    const count = Number(attendeeCount.rows[0].count);
    if (count > 0) {
      return errorResponse(`参加者が${count}人いるため削除できません`, 400);
    }

    // イベント削除
    await client.execute({
      sql: "DELETE FROM events WHERE id = ?",
      args: [eventId],
    });

    return jsonResponse({
      message: "イベントが削除されました",
      eventId,
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return errorResponse("イベントの削除中にエラーが発生しました", 500);
  }
}


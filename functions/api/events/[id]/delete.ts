import {validateEventAccess, isEventAuthError} from "../../utils/event-auth";
import {jsonResponse, errorResponse} from "../../utils/response";
import type {RequestContext} from "@shared/cloudflare-types";
import type {EventOperationResponse} from "../../../../shared/types";

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
      // 🔧 EventOperationResponse 形式でエラーを返す
      const response: EventOperationResponse = {
        success: false,
        message: `参加者が${count}人いるため削除できません`,
        error: `Cannot delete event with ${count} attendees`
      };
      return jsonResponse(response, 400);
    }

    // イベント削除
    await client.execute({
      sql: "DELETE FROM events WHERE id = ?",
      args: [eventId],
    });

    // 🔧 EventOperationResponse 形式で返す
    const response: EventOperationResponse = {
      success: true,
      message: "イベントが削除されました",
      eventId
    };

    return jsonResponse(response);
  } catch (error) {
    console.error("Error deleting event:", error);
    
    // 🔧 エラーも EventOperationResponse 形式で返す
    const errorResponse: EventOperationResponse = {
      success: false,
      message: "イベントの削除中にエラーが発生しました",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return jsonResponse(errorResponse, 500);
  }
}


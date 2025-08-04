// functions/api/utils/response.ts

// 既存のヘルパー関数（保持）
export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function errorResponse(message: string, status = 500) {
  return jsonResponse({ error: message }, status);
}

// 成功レスポンス用ヘルパー関数
export function successResponse(data: unknown, status = 200) {
  return jsonResponse(data, status);
}

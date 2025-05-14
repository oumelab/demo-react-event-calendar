// レスポンスヘルパー関数
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}
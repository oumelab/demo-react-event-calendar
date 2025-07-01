import type { 
  EventWithAttendees, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  CreateEventRequest,
  UpdateEventRequest,
  EventOperationResponse,
  EventApplyResponse,
  EventCancelResponse,
  UserRegistrationsResponse
} from "@shared/types";

// ベースAPIクライアント設定
const API_BASE_URL = '/api';

// 共通のfetch設定
const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // 認証クッキーを含める
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP Error: ${response.status}`);
  }
  
  return response;
};

// ========== イベント関連API ==========

// イベント一覧の情報+参加者数を取得
export async function getEvents(): Promise<EventWithAttendees[]> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events`);
  return response.json();
}

// 単一イベントの情報+参加者数を取得
export async function getEventById(id: string): Promise<EventWithAttendees> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/${id}`);
  return response.json();
}

// イベント作成
export async function createEvent(eventData: CreateEventRequest): Promise<EventOperationResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/create`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
  return response.json();
}

// イベント更新
export async function updateEvent(id: string, eventData: UpdateEventRequest): Promise<EventOperationResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/${id}/update`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
  return response.json();
}

// イベント削除
export async function deleteEvent(id: string): Promise<EventOperationResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/${id}/delete`, {
    method: 'DELETE',
  });
  return response.json();
}

// ========== 🆕 イベント申し込み・キャンセル関連API（新規追加） ==========

/**
 * イベント申し込み
 * @param eventId 申し込むイベントのID
 * @returns 申し込み結果
 */
export async function applyToEvent(eventId: string): Promise<EventApplyResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/${eventId}/apply`, {
    method: 'POST',
    body: JSON.stringify({}), // 申し込み時はボディなし（認証情報から取得）
  });
  return response.json();
}

/**
 * イベント申し込みキャンセル
 * @param eventId キャンセルするイベントのID
 * @returns キャンセル結果
 */
export async function cancelEventRegistration(eventId: string): Promise<EventCancelResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/events/${eventId}/cancel`, {
    method: 'DELETE',
    body: JSON.stringify({}), // キャンセル時もボディなし
  });
  return response.json();
}

/**
 * ユーザーの申し込み履歴取得
 * @param limit 取得件数（デフォルト: 20）
 * @param offset オフセット（デフォルト: 0）
 * @returns ユーザーの申し込み履歴
 */
export async function getUserRegistrations(
  limit: number = 20, 
  offset: number = 0
): Promise<UserRegistrationsResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  
  const response = await fetchWithCredentials(
    `${API_BASE_URL}/user/registrations?${params}`
  );
  return response.json();
}

// ========== 認証関連API ==========

// ログイン
export async function signIn(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/auth/sign-in`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
}

// 新規登録
export async function signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/auth/sign-up`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
}

// セッション確認
export async function getSession(): Promise<AuthResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/auth/session`);
  return response.json();
}

// ログアウト
export async function signOut(): Promise<AuthResponse> {
  const response = await fetchWithCredentials(`${API_BASE_URL}/auth/sign-out`, {
    method: 'POST',
  });
  return response.json();
}

// ========== TanStack Query用のキー定義 ==========

export const queryKeys = {
  // イベント関連
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  
  // 認証関連
  session: ['auth', 'session'] as const,
  user: ['auth', 'user'] as const,

  // 新規追加：申し込み履歴関連
  userRegistrations: ['user-registrations'] as const,
  userRegistrationsPaginated: (limit: number, offset: number) => 
    ['user-registrations', { limit, offset }] as const,
    
  // 特定イベントの申し込み状況（キャッシュ管理用）
  eventRegistrationStatus: (eventId: string) => 
    ['event-registration-status', eventId] as const,
} as const;
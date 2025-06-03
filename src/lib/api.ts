import type { 
  EventWithAttendees, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials
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
} as const;
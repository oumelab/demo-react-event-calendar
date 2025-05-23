// フロントとバックエンドで共有する型定義

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string;
  capacity?: number;
  created_at?: number;
}

export interface EventWithAttendees extends Event {
  attendees: number;
}


// ========== 認証関連の型（新規追加） ==========
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  user: User;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  authenticated?: boolean;
  user?: User;
  session?: Session;
  error?: string;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ========== イベント関連の型（既存を拡張） ==========
export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string;
  capacity?: number;
  created_at?: number;
  creator_id?: string; // 認証機能実装後に追加予定
}

export interface EventWithAttendees extends Event {
  attendees: number;
  creator_name?: string; // 作成者名（結合時）
  is_registered?: boolean; // 現在のユーザーが登録済みかどうか
}

// 参加者情報の型（既存のattendeesテーブル対応）
export interface Attendee {
  id: string;
  event_id: string;
  email: string;
  created_at: number;
  user_id?: string; // 認証ユーザーとの連携用（Phase 2で追加）
}

// ユーザーと結合された参加者情報
export interface AttendeeWithUser extends Attendee {
  user?: User;
}

// イベント登録情報
export interface EventRegistration {
  event: Event;
  attendee: Attendee;
  registration_date: string;
}

// ========== API レスポンス型 ==========
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 具体的な型を指定した使用例
export type EventListResponse = ApiResponse<EventWithAttendees[]>;
export type EventDetailResponse = ApiResponse<EventWithAttendees>;
export type RegistrationResponse = ApiResponse<Attendee>;
export type UserListResponse = ApiResponse<User[]>;

// ========== 型ガード関数 ==========
// null チェックを先に行い、その後に型安全にプロパティをチェック
export function isEventArray(data: unknown): data is EventWithAttendees[] {
  return Array.isArray(data) && data.every(isEvent);
}

export function isEvent(data: unknown): data is EventWithAttendees {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.date === 'string' &&
    typeof obj.location === 'string'
  );
}

export function isUser(data: unknown): data is User {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.emailVerified === 'boolean'
  );
}

export function isAuthResponse(data: unknown): data is AuthResponse {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  return typeof obj.success === 'boolean';
}
// フロントとバックエンドで共有する型定義

// 既存のEvent型
export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string;
  capacity?: number;
  created_at?: number;
  creator_id?: string | null; // イベント管理用に追加、null も許可
}

export interface EventWithAttendees extends Event {
  attendees: number;
}

// 認証関連の型定義
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

// API レスポンス用の型
export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  user?: User;
  session?: Session;
  message?: string;
  error?: string;
}

// 認証フォーム用の型
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// AuthContextType の定義
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  refreshUser: () => Promise<void>;
}

// 既存のSignInRequest/SignUpRequestはエイリアスとして保持
export type SignInRequest = LoginCredentials;
export type SignUpRequest = RegisterCredentials;

// Attendee型の拡張（認証対応）
export interface Attendee {
  id: string;
  event_id: string;
  email: string;
  created_at: number;
  user_id?: string; // オプショナルで Issue #5 に備える
}

export interface AttendeeWithUser extends Attendee {
  user?: User;
}

// イベント管理API用の型定義
export interface CreateEventRequest {
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string;
  capacity?: number;
}

// UpdateEventRequestは明示的に個別フィールドを定義
export interface UpdateEventRequest {
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  image_url?: string;
  capacity?: number;
}

// EventWithCreatorは既存のEventWithAttendeesを拡張
export interface EventWithCreator extends EventWithAttendees {
  creator_name?: string;
  creator_email?: string;
}

// API操作結果の型
export interface EventOperationResponse {
  success: boolean;
  message: string;
  eventId?: string;
  event?: Event;
  error?: string;
}
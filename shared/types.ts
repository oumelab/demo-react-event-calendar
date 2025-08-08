// フロントとバックエンドで共有する型定義
import type { UserWithAnonymous } from 'better-auth/plugins';
import type { Session } from 'better-auth/types';

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

// User型と Session型は Better Auth のものを使用

// API レスポンス用の型
export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  user?: UserWithAnonymous;
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


// Attendee型の拡張（認証対応）
export interface Attendee {
  id: string;
  event_id: string;
  email: string;
  created_at: number;
  user_id?: string; // オプショナルで既存データとの互換性保持
}


// 🆕 Issue #5: イベント申し込み・キャンセル機能用の型定義
// ===============================================================

// イベント申し込み情報（API レスポンス用）
export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  email: string;
  created_at: number;
}

// ユーザーの申し込み履歴（フロントエンド表示用）
export interface UserRegistration {
  id: string;
  event: Event;
  registered_at: number;
  can_cancel: boolean; // キャンセル可能かどうか
}

// イベント申し込み API レスポンス
export interface EventApplyResponse {
  success: boolean;
  message: string;
  registration: EventRegistration;
}

// イベントキャンセル API レスポンス
export interface EventCancelResponse {
  success: boolean;
  message: string;
  cancelled_registration_id: string;
}

// ユーザー申し込み履歴 API レスポンス
export interface UserRegistrationsResponse {
  registrations: UserRegistration[];
}

// イベント申し込み状態（フロントエンド用）
export interface EventRegistrationStatus {
  isRegistered: boolean;
  registrationId?: string;
  canRegister: boolean; // 申し込み可能かどうか
  canCancel: boolean;   // キャンセル可能かどうか
  reason?: string;      // 申し込み/キャンセル不可の理由
}

// イベント詳細 + 申し込み状態（フロントエンド用）
export interface EventWithRegistrationStatus extends EventWithAttendees {
  registrationStatus?: EventRegistrationStatus;
}

// 🆕 既存型の拡張
// ===============

// EventWithCreatorは既存のEventWithAttendeesを拡張
export interface EventWithCreator extends EventWithAttendees {
  creator_name?: string;
  creator_email?: string;
}

// API 操作結果の型（既存）
export interface EventOperationResponse {
  success: boolean;
  message: string;
  eventId?: string;
  event?: Event;
  error?: string;
}

// イベント管理API用の型定義
export interface CreateEventRequest {
  title: string;
  date: string;
  location: string;
  description?: string;
  image_url?: string;
  capacity?: number;
}

// UpdateEventRequestは明示的に個別フィールドを定義
export interface UpdateEventRequest {
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  image_url?: string | null; // 画像削除対応のためnullを許可
  capacity?: number;
}

// イベント作成履歴ページ用の型定義
// ===============================================================

// ユーザーの作成イベント履歴（フロントエンド表示用）
export interface UserCreatedEvent {
  id: string;
  event: EventWithAttendees;
  created_at: number;
  attendee_count: number;
  can_edit: boolean;
  can_delete: boolean;
}

// ユーザー作成イベント履歴 API レスポンス
export interface UserCreatedEventsResponse {
  success?: boolean; // 他のAPIレスポンスとの統一性のため追加
  createdEvents: UserCreatedEvent[];
  total?: number; // 将来的なページネーション用（オプショナル）
  message?: string;
}

// イベント作成者の状態（フロントエンド用）
export interface EventManagementStatus {
  canEdit: boolean;
  canDelete: boolean;
  attendeeCount: number;
  reason?: string; // 編集・削除不可の理由
}

// イベント詳細 + 管理状態（フロントエンド用）
export interface EventWithManagementStatus extends EventWithAttendees {
  managementStatus?: EventManagementStatus;
}

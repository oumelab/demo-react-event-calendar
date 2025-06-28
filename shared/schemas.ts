import { z } from 'zod';

// 🔄 既存フロントエンドスキーマからの移行
// 共通フィールドのスキーマ
const baseAuthSchema = z.object({
  email: z
    .string({ required_error: "メールアドレスは必須です" })
    .min(1, "メールアドレスは必須です")
    .email("有効なメールアドレスを入力してください"),
  password: z
    .string({ required_error: "パスワードは必須です" })
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128, "パスワードは128文字以内で入力してください"),
});

// ログインスキーマ（既存 loginSchema の移行）
export const LoginSchema = baseAuthSchema.extend({
  password: z
    .string({ required_error: "パスワードは必須です" })
    .min(1, "パスワードは必須です"), // ログイン時は既存パスワードなので文字数チェック不要
});

// 新規登録スキーマ（既存 registerSchema の移行）
export const RegisterSchema = baseAuthSchema.extend({
  name: z
    .string({ required_error: "お名前は必須です" })
    .trim()
    .min(1, "お名前は必須です")
    .max(20, "お名前は20文字以内で入力してください"), // Cookie警告解決済み
});

// 🆕 イベントスキーマ（新規作成）
export const CreateEventSchema = z.object({
  title: z
    .string({ required_error: "タイトルは必須です" })
    .trim()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内で入力してください'),
  date: z
    .string({ required_error: "開催日時は必須です" })
    .min(1, '開催日時は必須です'),
  location: z
    .string({ required_error: "開催場所は必須です" })
    .min(1, '開催場所は必須です')
    .max(100, '開催場所は100文字以内で入力してください'),
  description: z
    .string()
    .max(1000, '説明は1000文字以内で入力してください')
    .optional(),
  image_url: z
    .string()
    .url('有効なURLを入力してください')
    .optional()
    .or(z.literal('')),
  capacity: z
    .number({ 
      required_error: "定員は数値で入力してください",
      invalid_type_error: "定員は数値で入力してください" 
    })
    .int('定員は整数で入力してください')
    .min(1, '定員は1人以上で設定してください')
    .optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

// 🆕 イベント申し込み・キャンセル機能用のスキーマ
// ==============================================================

// イベント申し込み用のスキーマ（基本的にはボディなし、認証のみ）
export const EventApplySchema = z.object({
  // 申し込み時は追加のデータは不要（user_id は認証から取得）
  // 将来的にメッセージなどを追加する場合はここに定義
}).optional();

// イベントキャンセル用のスキーマ（基本的にはボディなし、認証のみ）
export const EventCancelSchema = z.object({
  // キャンセル時も追加のデータは不要
  // 将来的にキャンセル理由などを追加する場合はここに定義
  reason: z.string().max(500, 'キャンセル理由は500文字以内で入力してください').optional(),
}).optional();

// 申し込み履歴取得用のスキーマ（クエリパラメータ用）
export const UserRegistrationsQuerySchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default("20"),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional()
    .default("0"),
  status: z
    .enum(['all', 'active', 'cancelled'])
    .optional()
    .default('active'),
}).optional();

// 🆕 バックエンド用のデータ検証スキーマ
// ========================================

// Attendee データ検証用
export const AttendeeSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  event_id: z.string().min(1, 'イベントIDは必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  created_at: z.number().int().positive('作成日時は正の整数である必要があります'),
  user_id: z.string().min(1, 'ユーザーIDは必須です').optional(),
});

// EventRegistration データ検証用
export const EventRegistrationSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
  event_id: z.string().min(1, 'イベントIDは必須です'),
  user_id: z.string().min(1, 'ユーザーIDは必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  created_at: z.number().int().positive('作成日時は正の整数である必要があります'),
});

// User データ検証用（認証から受け取ったデータの検証）
export const UserSchema = z.object({
  id: z.string().min(1, 'ユーザーIDは必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 🆕 API レスポンススキーマ（バックエンドでの型チェック用）
// ==============================================================

export const EventApplyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  registration: EventRegistrationSchema,
});

export const EventCancelResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cancelled_registration_id: z.string(),
});

export const UserRegistrationsResponseSchema = z.object({
  registrations: z.array(z.object({
    id: z.string(),
    event: z.object({
      id: z.string(),
      title: z.string(),
      date: z.string(),
      location: z.string(),
      description: z.string(),
      image_url: z.string().optional(),
      capacity: z.number().optional(),
      created_at: z.number().optional(),
      creator_id: z.string().nullable().optional(),
    }),
    registered_at: z.number(),
    can_cancel: z.boolean(),
  })),
});

// 型の自動生成（既存型名との互換性確保）
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type CreateEventData = z.infer<typeof CreateEventSchema>;
export type UpdateEventData = z.infer<typeof UpdateEventSchema>;

// 🆕 イベント申し込み・キャンセル 用の型生成
export type EventApplyData = z.infer<typeof EventApplySchema>;
export type EventCancelData = z.infer<typeof EventCancelSchema>;
export type UserRegistrationsQuery = z.infer<typeof UserRegistrationsQuerySchema>;
export type AttendeeData = z.infer<typeof AttendeeSchema>;
export type EventRegistrationData = z.infer<typeof EventRegistrationSchema>;
export type UserData = z.infer<typeof UserSchema>;

// 🔄 既存型との互換性のためのエイリアス
export type LoginFormData = LoginData;
export type RegisterFormData = RegisterData;
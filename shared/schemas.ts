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

// 型の自動生成（既存型名との互換性確保）
export type LoginData = z.infer<typeof LoginSchema>;
export type RegisterData = z.infer<typeof RegisterSchema>;
export type CreateEventData = z.infer<typeof CreateEventSchema>;
export type UpdateEventData = z.infer<typeof UpdateEventSchema>;

// 🔄 既存型との互換性のためのエイリアス
export type LoginFormData = LoginData;
export type RegisterFormData = RegisterData;
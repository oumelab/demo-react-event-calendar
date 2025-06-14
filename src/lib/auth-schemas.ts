// src/lib/auth-schemas.ts
import { z } from "zod";

// 共通フィールドのスキーマ
const baseAuthSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスは必須です")
    .email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .max(128, "パスワードは128文字以内で入力してください"),
});

// ログインスキーマ（パスワードの最小文字数チェックを緩める）
export const loginSchema = baseAuthSchema.extend({
  password: z
    .string()
    .min(1, "パスワードは必須です"), // ログイン時は既存パスワードなので文字数チェック不要
});

// 新規登録スキーマ（共通スキーマ + 名前フィールド）
export const registerSchema = baseAuthSchema.extend({
  name: z
    .string()
    .trim() // 🎯 空白文字を除去
    .min(1, "お名前は必須です")
    .max(20, "お名前は20文字以内で入力してください"), // 🎯 Cookie警告解決
});

// 型推論
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
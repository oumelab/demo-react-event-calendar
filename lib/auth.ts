// lib/auth.ts
import { betterAuth } from "better-auth";
// import { createId } from "@paralleldrive/cuid2";
import Database from "better-sqlite3";

// Better Auth CLI用のSQLite設定（既存データベースを使用）
export const auth = betterAuth({
  database: new Database("./db/event_app.db"), // 既存のデータベースファイル
  secret: process.env.AUTH_SECRET || "dev-secret-min-32-chars-for-development",
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 1週間
  },
  
  // user: {
  //   additionalFields: {
  //     id: {
  //       type: "string",
  //       defaultValue: () => createId(),
  //       required: true,
  //     },
  //   },
  // },
});

// 型定義のエクスポート
export type Auth = typeof auth;
// src/lib/auth-client.ts (本番対応版)
import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

// 環境に応じたbaseURL取得関数
function getBaseURL(): string {
  // 開発環境の判定
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5173';
  }
  
  // 本番・プレビュー環境
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // フォールバック（SSR等でwindowが無い場合）
  return 'http://localhost:5173';
}

// Better Auth クライアント作成
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    anonymousClient(), // Anonymous プラグイン追加
  ],
});

// 🎯 Better Auth の型推論を使用
export type Session = typeof authClient.$Infer.Session;
export type User = Session['user']; // Session から User 型を抽出

// TypeScript向けの型エクスポート
export type AuthClient = typeof authClient;
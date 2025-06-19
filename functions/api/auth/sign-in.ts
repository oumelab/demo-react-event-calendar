// functions/api/auth/sign-in.ts (Better Auth対応版)
import {createAuthForRuntime} from "../utils/db";
import {authSuccessResponse, authErrorResponse} from "../utils/response";
import {validateEmail} from "../utils/auth";
import {APIError} from "better-auth/api";
import type {RequestContext} from "@shared/cloudflare-types";
import type {LoginCredentials} from "@shared/types";
import {transformBetterAuthUser} from "../utils/auth-data";
import {conditionalLog, conditionalError} from "../utils/logger";

export async function onRequest(context: RequestContext) {
  if (context.request.method !== "POST") {
    return authErrorResponse("Method not allowed", 405);
  }

  try {
    const auth = createAuthForRuntime(context.env);

    // 型安全にボディを取得
    const body = (await context.request.json()) as LoginCredentials;

    conditionalLog(context.env, "Login attempt for:", body.email);

    // バリデーション
    if (!body.email || !body.password) {
      return authErrorResponse("メールアドレスとパスワードは必須です", 400);
    }

    if (!validateEmail(body.email)) {
      return authErrorResponse("有効なメールアドレスを入力してください", 400);
    }

    // Better Auth のサインイン（レスポンスヘッダーも取得）
    conditionalLog(
      context.env,
      "Attempting Better Auth signInEmail with returnHeaders..."
    );

    const result = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
      headers: context.request.headers,
      returnHeaders: true, // ← これが重要！
    });

    conditionalLog(context.env, "Better Auth signInEmail result:", {
      hasResponse: !!result.response,
      hasUser: !!result.response?.user,
      userEmail: result.response?.user?.email,
      hasToken: !!result.response?.token,
      hasHeaders: !!result.headers,
    });

    // エラーハンドリング
    if (!result?.response || !result.response.user) {
      return authErrorResponse(
        "メールアドレスまたはパスワードが間違っています",
        401
      );
    }

    // 🆕 統一関数使用（1行）
    const user = transformBetterAuthUser(result.response.user);

    // セッション情報はBetter Authから直接取得できないため、undefinedに設定
    // （後でセッション確認APIで取得される）
    const session = undefined;

    conditionalLog(context.env, "Extracted data:", {
      hasUser: !!user,
      hasSession: !!session,
      token: result.response.token?.substring(0, 10) + "...",
    });

    // レスポンス作成
    const response = authSuccessResponse({
      authenticated: true,
      user,
      session,
      message: "ログインしました",
    });

    // Better Auth からのSet-Cookieヘッダーを転送
    if (result.headers) {
      const setCookieHeader = result.headers.get("set-cookie");
      if (setCookieHeader) {
        conditionalLog(
          context.env,
          "Setting cookies from Better Auth:",
          setCookieHeader
        );
        response.headers.set("Set-Cookie", setCookieHeader);
      }
    }

    return response;
  } catch (error) {
    conditionalError(context.env, "Sign in error:", error);

    // APIError の詳細なハンドリング
    if (error instanceof APIError) {
      conditionalLog(context.env, "APIError details:", {
        status: error.status,
        statusCode: error.statusCode,
        message: error.message,
        body: error.body,
      });

      // statusCode（数値）で判定
      if (
        error.statusCode === 401 ||
        error.message.includes("invalid credentials") ||
        error.message.includes("Invalid credentials")
      ) {
        return authErrorResponse(
          "メールアドレスまたはパスワードが間違っています",
          401
        );
      }

      return authErrorResponse(error.message, error.statusCode || 400);
    }

    if (error instanceof Error) {
      return authErrorResponse(error.message, 400);
    }

    return authErrorResponse("ログイン中にエラーが発生しました", 500);
  }
}

import { createAuthForRuntime } from '../utils/db';
import type { RequestContext } from '../../../shared/cloudflare-types';

export async function onRequest(context: RequestContext): Promise<Response> {
  // 公式ドキュメントに従い、context.params.catchall が配列として利用可能
  // 例: /api/auth/sign-in/email → context.params.catchall = ["sign-in", "email"]
  
  const auth = createAuthForRuntime(context.env);
  return await auth.handler(context.request);
}
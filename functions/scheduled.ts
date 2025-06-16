// functions/scheduled.ts
import type { Env } from '@shared/cloudflare-types';
import { getDbClient, createAuthForRuntime } from './api/utils/db';

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// 通常のGETリクエスト用（手動テスト用）
export async function onRequestGet(context: { env: Env }) {
  console.log('Manual warmup triggered:', new Date().toISOString());
  return await warmUp(context.env);
}

// Cron実行用のエクスポート
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Scheduled warmup started:', new Date().toISOString());
    console.log('Cron schedule:', event.cron);
    
    try {
      ctx.waitUntil(warmUp(env));
      console.log('Warmup completed successfully');
    } catch (error) {
      console.error('Warmup failed:', error);
    }
  }
};

// ウォームアップの実装
async function warmUp(env: Env) {
  const startTime = Date.now();
  const results: { service: string; status: string; duration: number }[] = [];

  // クライアントは一度だけ取得して使い回す
  const client = getDbClient(env);

  // 1. データベース接続の確認
  try {
    const dbStart = Date.now();
    await client.execute('SELECT 1 as test');
    
    const dbDuration = Date.now() - dbStart;
    results.push({ service: 'database', status: 'success', duration: dbDuration });
    console.log(`✓ Database connection warmed (${dbDuration}ms)`);
  } catch (error) {
    results.push({ service: 'database', status: 'error', duration: 0 });
    console.error('Database warmup failed:', error);
  }

  // 2. Better Auth の初期化
  try {
    const authStart = Date.now();
    createAuthForRuntime(env);
    
    const authDuration = Date.now() - authStart;
    results.push({ service: 'auth', status: 'success', duration: authDuration });
    console.log(`✓ Auth system warmed (${authDuration}ms)`);
  } catch (error) {
    results.push({ service: 'auth', status: 'error', duration: 0 });
    console.error('Auth warmup failed:', error);
  }

  // 3. 簡単なAPI呼び出しテスト（同じクライアント再利用）
  try {
    const apiStart = Date.now();
    await client.execute('SELECT COUNT(*) as count FROM events');
    
    const apiDuration = Date.now() - apiStart;
    results.push({ service: 'api', status: 'success', duration: apiDuration });
    console.log(`✓ API endpoints warmed (${apiDuration}ms)`);
  } catch (error) {
    results.push({ service: 'api', status: 'error', duration: 0 });
    console.error('API warmup failed:', error);
  }

  const totalDuration = Date.now() - startTime;
  
  const response = {
    status: 'warmed',
    timestamp: new Date().toISOString(),
    totalDuration: `${totalDuration}ms`,
    services: results,
    environment: env?.ENVIRONMENT || 'development'
  };

  console.log('Warmup summary:', JSON.stringify(response, null, 2));

  return new Response(JSON.stringify(response, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
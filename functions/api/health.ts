// functions/api/health.ts (一時的なテスト用)
import type { RequestContext } from '@shared/cloudflare-types';

export async function onRequestGet(context: RequestContext): Promise<Response> {
  try {
    // 環境変数とR2バインディングの確認
    const health = {
      timestamp: new Date().toISOString(),
      environment: context.env.ENVIRONMENT || 'unknown',
      database: {
        hasUrl: !!context.env.TURSO_DB_URL,
        hasToken: !!context.env.TURSO_DB_AUTH_TOKEN,
      },
      auth: {
        hasSecret: !!context.env.BETTER_AUTH_SECRET,
      },
      r2: {
        hasBucket: !!context.env.IMAGES_BUCKET,
        bucketType: typeof context.env.IMAGES_BUCKET,
        connectionTest: 'pending' as 'success' | 'failed' | 'pending',
        objectCount: 0,
        error: null as string | null,
        // バインディング詳細確認
        bindingDetails: context.env.IMAGES_BUCKET ? {
          put: typeof context.env.IMAGES_BUCKET.put,
          get: typeof context.env.IMAGES_BUCKET.get,
          delete: typeof context.env.IMAGES_BUCKET.delete,
          list: typeof context.env.IMAGES_BUCKET.list,
        } : null,
        functionalTest: null as {
          put: boolean;
          get: boolean;
          content: string | null;
        } | null
      }
    };

    // R2バケットの簡易テスト
    if (context.env.IMAGES_BUCKET) {
      try {
        // listオペレーションで接続確認
        const listResult = await context.env.IMAGES_BUCKET.list({ 
          limit: 1,
          prefix: 'health-check/'
        });
        health.r2.connectionTest = 'success';
        health.r2.objectCount = listResult.objects.length;
        health.r2.error = null;

        // 簡単なテストファイルをput/getしてみる
        const testKey = 'health-check/test.txt';
        const testContent = 'Health check test';
        
        // PUT テスト
        const putResult = await context.env.IMAGES_BUCKET.put(testKey, testContent);
        
        // GET テスト
        const getResult = await context.env.IMAGES_BUCKET.get(testKey);
        
        // DELETE テスト（クリーンアップ）
        await context.env.IMAGES_BUCKET.delete(testKey);

        health.r2 = {
          ...health.r2,
          functionalTest: {
            put: !!putResult,
            get: !!getResult,
            content: getResult ? await getResult.text() : null
          }
        };

      } catch (error) {
        health.r2.connectionTest = 'failed';
        health.r2.objectCount = 0;
        health.r2.error = error instanceof Error ? error.message : 'unknown';
      }
    }

    return new Response(JSON.stringify(health, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
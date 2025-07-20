// src/pages/AuthPage.tsx
import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import { useSessionQuery } from '@/hooks/useAuth';
import { AuthForm } from '../components/auth/AuthForm';
import Card from '../components/card';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const { isLoading } = useSessionQuery();
  
  // URLパスによってモードを切り替え
  const isLogin = location.pathname === '/login';
  const mode = isLogin ? 'login' : 'register';

  // 統一されたリダイレクト処理（useCallback でメモ化）
  const handleAuthSuccess = useCallback(() => {
    const from = location.state?.from?.pathname;
    
    if (from && from !== '/login' && from !== '/register') {
      // ProtectedRoute から来た場合：元のページに戻る
      navigate(from, { replace: true });
    } else {
      // 直接アクセスの場合：イベント一覧へ
      navigate('/events', { replace: true });
    }
  }, [location.state?.from?.pathname, navigate]);

  // 認証済みユーザーのリダイレクト処理
  useEffect(() => {
    if (isAuthenticated) {
      handleAuthSuccess();
    }
  }, [isAuthenticated, handleAuthSuccess]);

  // 🔧 ローディング中または認証済みの場合は何も表示しない
  if (isLoading || isAuthenticated) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <h2 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? 'ログイン' : '新規登録'}
        </h2>
        <p className="text-gray-600">{isLogin
    ? "アカウントにログインしてイベントに参加しましょう"
    : "アカウントを作成してイベントに参加しましょう"}</p>

        <AuthForm mode={mode} onSuccess={handleAuthSuccess} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-6">
            {isLogin ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}
          </p>
          <a
            href={isLogin ? '/register' : '/login'}
            className="text-sky-600 hover:text-sky-800 font-medium"
          >
            {isLogin ? '新規登録' : 'ログイン'}
          </a>
        </div>
      </Card>
    </div>
  );
}
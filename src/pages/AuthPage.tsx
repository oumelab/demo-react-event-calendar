// src/pages/AuthPage.tsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { AuthForm } from '../components/auth/AuthForm';
import Card from '../components/card';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { redirectAfterAuth } = useAuthRedirect();
  
  // URLパスによってモードを切り替え
  const isLogin = location.pathname === '/login';
  const mode = isLogin ? 'login' : 'register';

  // 🔧 重要：認証済みユーザーのリダイレクト処理を復活
  useEffect(() => {
    if (isAuthenticated) {
      // ProtectedRouteからのリダイレクトかどうかを確認
      const hasRedirectTarget = location.state?.from?.pathname;

      if (hasRedirectTarget) {
        // ProtectedRouteから来た場合：元のページに戻る
        redirectAfterAuth();
      } else {
        // 直接ログインページにアクセスした場合：イベント一覧へ
        navigate('/events', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, location.state, redirectAfterAuth]);

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

        <AuthForm mode={mode} onSuccess={redirectAfterAuth} />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
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
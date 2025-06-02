import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import Card from '../components/card';
import type { LoginCredentials, RegisterCredentials } from '@shared/types';

interface AuthFormData {
  email: string;
  password: string;
  name: string;
}

export default function AuthPage() {
  const location = useLocation();
  const { login, register, isLoading } = useAuth();
  const { redirectAfterAuth } = useAuthRedirect();
  
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  
  const [credentials, setCredentials] = useState<AuthFormData>({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState<string>('');

  // 動的なテキスト
  const title = isLogin ? 'ログイン' : '新規登録';
  const subtitle = isLogin 
    ? 'アカウントにログインしてイベントに参加しましょう'
    : 'アカウントを作成してイベントに参加しましょう';
  const buttonText = isLogin ? 'ログイン' : 'アカウント作成';
  const loadingText = isLogin ? 'ログイン中...' : 'アカウント作成中...';
  const linkText = isLogin ? '新規登録' : 'ログイン';
  const linkPath = isLogin ? '/register' : '/login';
  const linkDescription = isLogin 
    ? 'アカウントをお持ちでない方は' 
    : '既にアカウントをお持ちの方は';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 新規登録時のパスワード長チェック
    if (isRegister && credentials.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }

    try {
      if (isLogin) {
        const loginCredentials: LoginCredentials = {
          email: credentials.email,
          password: credentials.password,
        };
        await login(loginCredentials);
      } else {
        const registerCredentials: RegisterCredentials = {
          email: credentials.email,
          password: credentials.password,
          name: credentials.name,
        };
        await register(registerCredentials);
      }
      
      redirectAfterAuth(); // 改善されたリダイレクト
    } catch (err) {
      setError(err instanceof Error ? err.message : 
        isLogin ? 'ログインに失敗しました' : 'アカウント作成に失敗しました'
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 新規登録時のみ名前フィールド表示 */}
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={credentials.name}
                  onChange={handleChange}
                  required={isRegister}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="お名前を入力"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                minLength={isRegister ? 8 : undefined}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder={isRegister ? "8文字以上のパスワード" : "パスワードを入力"}
              />
              {isRegister && (
                <p className="text-xs text-gray-500 mt-1">
                  パスワードは8文字以上で入力してください
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2'
            }`}
          >
            {isLoading ? loadingText : buttonText}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {linkDescription}{' '}
              <Link
                to={linkPath}
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                {linkText}
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
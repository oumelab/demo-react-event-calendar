// src/components/auth/LoginForm.tsx
import { useAuthMutations } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LoginSchema, type LoginFormData } from '@shared/schemas';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { PasswordInput } from '../ui/password-input';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, isLoggingIn, anonymousLogin, isAnonymousLogging } = useAuthMutations();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      form.setError('root', { type: 'manual', message });
    }
  };

   // 🆕 匿名ログイン処理（既存パターンに合わせて実装）
  const handleAnonymousLogin = async () => {
    try {
      await anonymousLogin();
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ゲストログインに失敗しました';
      form.setError('root', { type: 'manual', message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* 5. form.formState.errors に基づいてエラーメッセージが表示される */}
        {form.formState.errors.root && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{form.formState.errors.root.message}</p>
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className='bg-white/70 border border-zinc-500 focus:ring-sky-500'
                  placeholder="your@email.com"
                  autoComplete="email"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <PasswordInput
                  className='bg-white/70 border border-zinc-500 focus:ring-sky-500'
                  placeholder="パスワードを入力"
                  autoComplete="current-password"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className={`w-full mt-3 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
              isLoggingIn || form.formState.isSubmitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            }`}
          disabled={form.formState.isSubmitting}
        >
          {isLoggingIn ? '処理中...' : 'ログイン'}
        </Button>

        {/* 🆕 区切り線 */}
        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-blue-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">または</span>
            </div>
          </div>
        </div>

        {/* 🆕 匿名ログインボタン */}
        <Button
          type="button"
          onClick={handleAnonymousLogin}
          disabled={isAnonymousLogging || form.formState.isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isAnonymousLogging || form.formState.isSubmitting
              ? "bg-gray-400 text-gray-700 border-sky-700 cursor-not-allowed"
              : "bg-gray-50 text-gray-600 hover:bg-blue-50 border hover:text-sky-600 border-blue-300 cursor-pointer"
          }`}
        >
          {isAnonymousLogging ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ゲストログイン中...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              👤 ゲストとして試用する
            </span>
          )}
        </Button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          アカウント登録不要でイベントを閲覧・申し込みできます
        </p>
      </form>
    </Form>
  );
}
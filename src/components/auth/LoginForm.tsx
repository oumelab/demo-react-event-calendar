// src/components/auth/LoginForm.tsx
import { useAuthStore } from '@/stores/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loginSchema, type LoginFormData } from '../../lib/auth-schemas';
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
  const [error, setError] = useState<string>('');
  const { login } = useAuthStore();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setError(''); // エラークリア
      await login(data);
      onSuccess();
    } catch (error) {
      // エラーはフォーム内に表示
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      setError(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
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
                  className='border border-gray-500 focus:ring-sky-500'
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
                  className='border border-gray-500 focus:ring-sky-500'
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
          className={`w-full mt-3 py-3 px-4 rounded-lg font-medium transition-colors ${
              form.formState.isSubmitting
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            }`}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? '処理中...' : 'ログイン'}
        </Button>
      </form>
    </Form>
  );
}
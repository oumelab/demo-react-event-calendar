// src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema, type LoginFormData } from '../../lib/auth-schemas';
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
import { Button } from '../ui/button';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth();
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('ログインしました');
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログインに失敗しました';
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
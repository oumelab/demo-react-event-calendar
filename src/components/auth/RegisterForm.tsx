// src/components/auth/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { registerSchema, type RegisterFormData } from '../../lib/auth-schemas';
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

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      toast.success('アカウントを作成しました');
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'アカウント作成に失敗しました';
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                お名前 <span className="text-xs text-gray-500">(20文字以内)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className='border border-gray-500 focus:ring-sky-500'
                  placeholder="山田太郎"
                  maxLength={20}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="8文字以上で入力してください"
                  autoComplete="new-password"
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
          {form.formState.isSubmitting ? '処理中...' : 'アカウント作成'}
        </Button>
      </form>
    </Form>
  );
}
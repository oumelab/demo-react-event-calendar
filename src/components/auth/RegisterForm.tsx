// src/components/auth/RegisterForm.tsx
import { useAuthMutations } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterSchema, type RegisterFormData } from "@shared/schemas";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { PasswordInput } from "../ui/password-input";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({onSuccess}: RegisterFormProps) {
  const { register, isRegistering} = useAuthMutations();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'アカウント作成に失敗しました';
      form.setError('root', { type: 'manual', message });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{form.formState.errors.root.message}</p>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>
                お名前{" "}
                <span className="text-xs text-gray-500">(20文字以内)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
                  placeholder="山田太郎"
                  maxLength={20}
                  autoComplete="name"
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
          name="email"
          render={({field}) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
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
          render={({field}) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <PasswordInput
                  className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
                  placeholder="8文字以上で入力してください"
                  autoComplete="new-password"
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
            form.formState.isSubmitting
              ? "bg-gray-400 text-gray-700 cursor-not-allowed"
              : "bg-sky-600 text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          }`}
          disabled={form.formState.isSubmitting}
        >
          {isRegistering ? "処理中..." : "アカウント作成"}
        </Button>
      </form>
    </Form>
  );
}

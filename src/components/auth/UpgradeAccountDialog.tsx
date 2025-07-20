// src/components/auth/UpgradeAccountDialog.tsx
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { authQueryKeys } from '@/hooks/useAuth';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/stores/auth-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, type RegisterFormData } from '@shared/schemas';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface UpgradeAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpgradeAccountDialog({ open, onClose, onSuccess }: UpgradeAccountDialogProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient(); // クエリキャッシュを更新(ユーザーの本アカウントor匿名アカウントの切り替え)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  const handleUpgrade = async (data: RegisterFormData) => {
    setIsUpgrading(true);
    
    try {
      // Better Auth の匿名→正規アカウント移行機能を使用
      // 匿名ユーザーがログイン中に signUp を実行すると、自動的にアカウントが移行される
      const { data: authData, error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (authData?.user) {
        // ✅ 移行成功：Zustand ストアを更新
        setUser({
          ...authData.user,
          image: authData.user.image ?? undefined,
          isAnonymous: false, // 正規ユーザーに移行完了
        });

        // 🆕 TanStack Query のキャッシュを更新
        queryClient.setQueryData(authQueryKeys.session, authData);
        
        // 🆕 関連するクエリを無効化してリフレッシュ
        queryClient.invalidateQueries({ queryKey: authQueryKeys.session });
        queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        
        // 🆕 少し待ってから状態確認（Better Auth の内部処理完了を待つ）
        setTimeout(async () => {
          try {
            // 最新のセッション情報を取得
            const { data: latestSession } = await authClient.getSession();
            if (latestSession?.user) {
              setUser({
                ...latestSession.user,
                image: latestSession.user.image ?? undefined,
                isAnonymous: latestSession.user.isAnonymous ?? false,
              });
              queryClient.setQueryData(authQueryKeys.session, latestSession);
            }
          } catch (error) {
            console.warn('最新セッション取得に失敗:', error);
          }
        }, 500);
        
        toast.success('アカウントを作成し、データを移行しました！');
        onSuccess();
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'アカウント移行に失敗しました';
      form.setError('root', { type: 'manual', message });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-sky-500">
        <DialogHeader>
          <div className="flex items-baseline gap-2 mb-4">
            <UserPlus className="size-5 text-sky-600" />
            <DialogTitle className="text-xl">アカウントを作成してデータを保存</DialogTitle>
          </div>
          <DialogDescription>
            現在のゲスト活動データを引き継いで、正規アカウントを作成します
          </DialogDescription>
        </DialogHeader>

        {/* データ移行の説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="flex items-center gap-2 font-bold text-sky-700 mb-3">
            移行されるデータ
          </h4>
          <ul className="space-y-2 text-sm text-sky-600 pl-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              イベント申し込み履歴
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              閲覧履歴・設定
            </li>
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpgrade)} className="space-y-4">
            {/* エラー表示 */}
            {form.formState.errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{form.formState.errors.root.message}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>お名前</FormLabel>
                  <FormControl>
                    <Input
                      className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
                      placeholder="山田太郎"
                      autoComplete="name"
                      disabled={isUpgrading}
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
                      className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
                      placeholder="your@email.com"
                      autoComplete="email"
                      disabled={isUpgrading}
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
                      className="bg-white/70 border border-zinc-500 focus:ring-sky-500"
                      placeholder="8文字以上のパスワード"
                      autoComplete="new-password"
                      disabled={isUpgrading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUpgrading}
                className="flex-1 border border-sky-500 hover:bg-sky-50 text-sky-600 cursor-pointer"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isUpgrading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
              >
                {isUpgrading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    移行中...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    アカウント作成
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
// src/components/auth/AuthSyncer.tsx
import { useEffect } from 'react';
import { useSessionQuery } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth-store';
import { UserWithAnonymous } from 'better-auth/plugins';

export function AuthSyncer() {
  const { data: sessionData, isLoading } = useSessionQuery();
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!isLoading) {
      const serverUser = sessionData?.user ?? null;
      
      // ユーザーIDが変わった場合のみ更新
      if (currentUser?.id !== serverUser?.id) {
        setUser(serverUser ? {
          ...serverUser,
          isAnonymous: serverUser.isAnonymous ?? false
        } as UserWithAnonymous : null);
      }
    }
  }, [sessionData, isLoading, currentUser?.id, setUser]);

  return null; // UIを持たない
}
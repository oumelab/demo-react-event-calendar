// src/components/auth/AuthForm.tsx
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSuccess: () => void;
}

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const isLogin = mode === 'login';

  // 🎯 シンプルな条件分岐：モード別にコンポーネントを切り替え
  if (isLogin) {
    return <LoginForm onSuccess={onSuccess} />;
  } else {
    return <RegisterForm onSuccess={onSuccess} />;
  }
}
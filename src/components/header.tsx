import {CalendarDays} from "lucide-react";
import {Link} from "react-router";
import {useAuthStore} from "@/stores/auth-store";
import UserMenu from "./UserMenu";
import {useAuthMutations, useSessionQuery} from "@/hooks/useAuth";

export default function Header() {
  const {isLoading} = useSessionQuery();
  const {logout} = useAuthMutations();
  // const {user, isAuthenticated} = useAuthStore((state) => ({
  //   user: state.user,
  //   isAuthenticated: !!state.user,
  // }));
  // 状態を一つずつ、別々に取得する
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => !!state.user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // エラー通知のみここで実行（ストアでは成功通知のみ）
      // エラー処理はUIレイヤーで行う
    }
  };

  return (
    <header className="max-w-4xl mx-auto text-center py-6 px-1">
      <div className="flex justify-between items-center gap-4">
        <Link to="/events" className="w-fit flex items-center gap-2">
          <span className="grid place-content-center bg-black size-10 rounded-full">
            <CalendarDays size={20} className="text-sky-300" />
          </span>
          <span>React Event Calendar</span>
        </Link>
        {isLoading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : isAuthenticated && user ? (
          <UserMenu user={user} handleLogout={handleLogout} />
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              ログイン
            </Link>
            <Link
              to="/register"
              className="hidden sm:block text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700 transition-colors"
            >
              新規登録
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

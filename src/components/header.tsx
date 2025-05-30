import { CalendarDays, User, LogOut } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="max-w-4xl mx-auto text-center space-y-4 py-5">     
        <div className="flex justify-between items-center gap-4">
          <Link to="/events" className="w-fit flex items-center gap-4"><span className="grid place-content-center bg-black size-10 rounded-full">
          <CalendarDays size={20} className="text-sky-300" />
        </span><span>React Event Calendar</span></Link>
          {isLoading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="grid border border-sky-500 place-content-center size-8 rounded-full bg-gradient-to-br from-slate-50 to-sky-100">
                <User size={16} />
                </span>
                <span className="text-sm">
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            </div>
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
                className="text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700 transition-colors"
              >
                新規登録
              </Link>
            </div>
          )}
          </div>
      {/* <div className="flex sm:items-center gap-3 justify-center w-fit mx-auto">
        <span className="grid place-content-center bg-black size-20 rounded-full">
          <CalendarDays size={40} className="text-sky-300" />
        </span>
        <Link to="/events" className="block flex-1">
          <h1 className="text-left md:text-center text-4xl md:text-5xl font-bold mb-4 text-gray-800 leading-snug">
            React イベントカレンダー
          </h1>
        </Link>
      </div>
      
      <p className="text-left md:text-center text-base text-gray-700">
        定期的に開催されるイベントをチェックして、学習と交流を加速させましょう。
        <br />
        最新情報を受け取りたい場合は、ぜひフォローしてください。
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="#" className="text-sky-500 hover:underline">
          Twitter
        </a> */}
        
        {/* 認証状態表示 */}
        {/* <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={16} />
                <span className="text-sm">
                  こんにちは、{user.name}さん
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            </div>
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
                className="text-sm bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700 transition-colors"
              >
                新規登録
              </Link>
            </div>
          )} */}
        {/* </div>
      </div> */}
    </header>
  );
}
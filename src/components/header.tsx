import {Link} from "react-router";
import {useAuth} from "../hooks/useAuth";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {CalendarDays, User, LogOut, ChevronDown} from "lucide-react";

export default function Header() {
  const {user, isAuthenticated, isLoading, logout} = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="max-w-4xl mx-auto text-center space-y-4 py-5">
      <div className="flex justify-between items-center gap-4">
        <Link to="/events" className="w-fit flex items-center gap-4">
          <span className="grid place-content-center bg-black size-10 rounded-full">
            <CalendarDays size={20} className="text-sky-300" />
          </span>
          <span>React Event Calendar</span>
        </Link>
        {isLoading ? (
          <div className="text-gray-500">読み込み中...</div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger className="group flex items-center gap-2 cursor-pointer focus:outline-none">
                <Avatar className="size-[34px] group-focus:outline-none group-focus:ring-2 group-focus:ring-sky-500 group-focus:ring-offset-2">
                  {user.image && user.name && (
                    <AvatarImage src={user.image} alt={user.name} />
                  )}
                  <AvatarFallback className="border border-sky-500 bg-gradient-to-br from-slate-50 to-sky-100">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate" title={user.name || ""}>
                  {user.name}
                </span>
                <ChevronDown size={14} className="flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="max-w-56 border-zinc-300 bg-white">
                <DropdownMenuItem title={user.name || ""}>
                  <User size={14} />
                  <span className="truncate">
                    {user.name}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-200 h-[1px] mx-[2px]" />
                <DropdownMenuItem asChild>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    ログアウト
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
    </header>
  );
}

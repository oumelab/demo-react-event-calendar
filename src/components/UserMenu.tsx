import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserWithAnonymous } from "better-auth/plugins";
import { ChevronDown, History, List, LogOut, Plus, User } from "lucide-react";
import { Link } from "react-router";

export default function UserMenu({
  user,
  handleLogout,
}: {
  user: UserWithAnonymous;
  handleLogout: () => void;
}) {
  return (
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
          <span
            className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate"
            title={user.name || ""}
          >
            {user.name}
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="max-w-56 border-zinc-300 bg-white"
        >
          <DropdownMenuItem title={user.name || ""}>
            <User size={14} />
            <span className="truncate">{user.name}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-200 h-[1px] mx-[2px]" />

          <DropdownMenuItem asChild>
            <Link
              to="/user/registrations"
              className="w-full flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <History size={14} />
              申し込み履歴
            </Link>
          </DropdownMenuItem>

          {!user.isAnonymous && (
            <DropdownMenuItem asChild>
              <Link
                to="/user/created-events"
                className="w-full flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <List size={14} />
                イベント管理
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link
              to="/events/create"
              className="w-full flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              イベント作成
            </Link>
          </DropdownMenuItem>
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
  );
}

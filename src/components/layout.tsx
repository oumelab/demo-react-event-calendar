import { CalendarDays } from "lucide-react";
import { Outlet, Link } from "react-router";

const TWITTER_URL = "#";
const GITHUB_URL = "#";
const HANDLE_NAME = "your-handle";
export default function Layout() {
  return (
    <>
      <div className="container mx-auto py-16 space-y-8 min-h-screen">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <span className="inline-flex items-center justify-center bg-black h-20 w-20 rounded-full">
              <CalendarDays size={40} className="text-sky-300" />
            </span>
            <Link to="/events" className="block">
            <h1 className="text-5xl font-bold mb-4 text-gray-800">
              React イベントカレンダー
            </h1>
            </Link>
          </div>
          <p className="text-base text-gray-700">
            定期的に開催されるイベントをチェックして、学習と交流を加速させましょう。
            <br />
            最新情報を受け取りたい場合は、ぜひフォローしてください。
          </p>

          <a href={TWITTER_URL} className="text-sky-500 hover:underline">
            Twitter
          </a>
        </header>

        {/* Page Content */}
        <Outlet />

        {/* Footer */}
        <footer className="text-center ">
          <p className="text-gray-700">
            Created by{" "}
            <a className="text-sky-500" href={GITHUB_URL}>
              @{HANDLE_NAME}
            </a>{" "}
            &copy; 2025
          </p>
        </footer>
      </div>
    </>
  );
};
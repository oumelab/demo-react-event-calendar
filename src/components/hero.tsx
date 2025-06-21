// src/components/Hero.tsx
import { useAuthStore } from "@/stores/auth-store";
import { CalendarDays, Users, Zap } from "lucide-react";
import { Link, useLocation } from "react-router";

export default function Hero() {
  const isAuthenticated = useAuthStore((state) => !!state.user);
  const location = useLocation();

  // イベント一覧ページ（トップページ）でのみ表示
  const shouldShowHero =
    location.pathname === "/" || location.pathname === "/events";

  if (!shouldShowHero) {
    return null;
  }

  return (
    <section className="max-w-4xl mx-auto bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl py-10 px-6 mb-8">
      <div className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 w-fit mx-auto text-center sm:text-left">
          🎉 イベントで学習と<span className="inline-block">交流を加速</span>
        </h2>

        {/* 特徴の紹介 */}
        <div className="w-fit sm:w-full mx-auto flex flex-col sm:flex-row gap-4 sm:gap-7 justify-center sm:items-center text-md text-gray-600 py-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-7 text-sky-600" />
            <span>定期開催</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-7 text-sky-600" />
            <span>コミュニティ主導</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="size-7 text-sky-600" />
            <span>実践的な学習</span>
          </div>
        </div>

        <p className="text-zinc-600 w-full sm:max-w-lg mx-auto">
          React、TypeScript、Web開発の最新トレンドを学べるイベントに参加して、
          エンジニア同士のネットワークを広げましょう
        </p>

        {/* 🎯 認証状態に応じたCTA */}
        {!isAuthenticated ? (
          <div className="space-y-4 text-center">
            <Link
              to="/register"
              state={{from: {pathname: location.pathname}}}
              className="inline-block px-8 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-lg hover:shadow-xl"
            >
              今すぐ参加登録 🚀
            </Link>
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの方は{" "}
              <Link
                to="/login"
                state={{from: {pathname: location.pathname}}}
                className="text-sky-600 hover:text-sky-700 font-medium underline inline-block"
              >
                こちらからログイン
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-gray-900">
              おかえりなさい！新しいイベントをチェックしましょう
            </p>
            <button
              onClick={() => {
                const eventsSection = document.getElementById("new-events");
                if (eventsSection) {
                  eventsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
              className="inline-block px-8 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors"
            >
              イベントを見る
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

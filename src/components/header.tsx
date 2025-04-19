import { CalendarDays } from "lucide-react";
import { Link } from "react-router";

export default function Header({ twitterUrl }: { twitterUrl: string }) {
  return (
    <header className="text-center space-y-4">
          <div className="flex sm:items-center gap-3 justify-center w-fit mx-auto">
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

          <a href={twitterUrl} className="text-sky-500 hover:underline">
            Twitter
          </a>
        </header>
  )
}
import { CalendarDays } from "lucide-react";
import { Link } from "react-router";
import { UserInfo } from "@/constants";

export default function Hero() {
  return (
    <div className="space-y-6 py-12">
      <div className="flex sm:items-center md:items-baseline gap-6 justify-center w-fit mx-auto">
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
        <a href={UserInfo.TWITTER_URL} className="text-sky-500 hover:underline">
          Twitter
        </a>
      </div>
    </div>
  );
}

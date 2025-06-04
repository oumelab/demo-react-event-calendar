import { UserInfo } from "@/constants";
import { Link } from "react-router";

export default function Hero() {
  return (
    <div className="space-y-6 py-12">
      <div className="w-fit mx-auto mb-8">
        <Link to="/events">
          <h1 className="text-center text-4xl md:text-5xl font-bold text-gray-800 leading-snug">
            React イベント<span className="inline-block">カレンダー</span>
          </h1>
        </Link>
      </div>

      <p className="text-left md:text-center text-base leading-loose text-gray-700">
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

import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="py-24 space-y-4">
      <h1 className="text-4xl font-bold text-center">404 Not Found</h1>
      <p className="w-fit mx-auto">お探しのページが見つかりません。</p>
      <p className="w-full sm:max-w-2xl sm:text-center mx-auto mt-12 px-6 sm:px-0 text-zinc-500">お探しのページは削除されたかURLが変更されたため表示できません。</p>
      <Link to="/" className="block w-fit mx-auto mt-12 text-sky-500 underline underline-offset-2 hover:text-sky-700">トップページに戻る</Link>
    </div>
  )
}
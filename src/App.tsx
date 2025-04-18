import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/events" />} />
        <Route path="events" element={<p>イベントリストを表示</p>} />
        {/* 動的な値に応じたURL */}
        <Route path="events/:id" element={<p>イベント詳細を表示</p>} />
        <Route path="events/:id/apply" element={<p>イベントに申し込む</p>} />
        <Route path="events/:id/confirm" element={<p>申し込み完了です</p>} />
        {/* 存在しないURLの処理 */}
        <Route path="*" element={<p>404 not found</p>} />
      </Routes>
    </BrowserRouter>
  );
}
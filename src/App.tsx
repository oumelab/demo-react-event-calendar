import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import EventList from "./pages/event-list";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/events" />} />
        {/* ネストしたルート */}
        <Route path="events" element={<Layout />}>
          <Route index element={<EventList />} />
          {/* 動的な値に応じたURL */}
          <Route path=":id" element={<p>イベント詳細を表示</p>} />
          <Route path=":id/apply" element={<p>イベントに申し込む</p>} />
          <Route path=":id/confirm" element={<p>申し込み完了です</p>} />
        </Route>
        {/* 存在しないURLの処理 */}
        <Route path="*" element={<p>404 not found</p>} />
      </Routes>
    </BrowserRouter>
  );
}
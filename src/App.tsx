import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout";
import EventList from "./pages/event-list";
import EventDetail from "./pages/event-detail";
import EventApply from "./pages/event-apply";
import EventConfirm from "./pages/event-confirm";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/events" />} />
        {/* ネストしたルート */}
        <Route path="events" element={<Layout />}>
          <Route index element={<EventList />} />
          {/* 動的な値に応じたURL */}
          <Route path=":id" element={<EventDetail />} />
          <Route path=":id/apply" element={<EventApply />} />
          <Route path=":id/confirm" element={<EventConfirm />} />
        </Route>
        {/* 存在しないURLの処理 */}
        <Route path="*" element={<p>404 not found</p>} />
      </Routes>
    </BrowserRouter>
  );
}
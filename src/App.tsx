import {createBrowserRouter, Navigate, RouterProvider, ScrollRestoration} from "react-router";
import Layout from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute";
import EventApply from "./pages/event-apply";
import EventConfirm from "./pages/event-confirm";
import EventDetail from "./pages/event-detail";
import EventList from "./pages/event-list";
import EventEditPage from "./pages/EventEditPage";
import UserRegistrationsPage from "./pages/UserRegistrationsPage";
import EventCancelCompletePage from "./pages/EventCancelCompletePage";
import NotFound from "./pages/not-found";
// Tanstack Queryのデバッグツール
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {AuthSyncer} from "./components/auth/AuthSyncer";
import AuthPage from "./pages/AuthPage";
// 遅延読み込み
import { lazy } from "react";
import UserCreatedEventsPage from "./pages/UserCreatedEventsPage";
const EventCreatePage = lazy(() => import('./pages/EventCreatePage'));

function LayoutWithScrollRestoration() {
  return (
    <>
      <Layout />
      {/* React Router の ScrollRestoration で全ページのスクロール位置を自動管理 */}
      <ScrollRestoration />
    </>
  );
}

export default function App() {
  return (
    <>
      <AuthSyncer />
      <RouterProvider router={router} />
      {/* 開発環境のみでデバッグツールを表示 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}

const router = createBrowserRouter([
  {
    Component: LayoutWithScrollRestoration,
    children: [
      {
        index: true,
        Component: () => Navigate({to: "/events"}),
      },
      {
        path: "events",
        Component: EventList,
      },
      {
        path: "events/create",
        Component: () => (
          <ProtectedRoute>
            <EventCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id",
        Component: EventDetail,
      },
      {
        path: "events/:id/edit",
        Component: () => (
          <ProtectedRoute>
            <EventEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id/apply",
        Component: () => (
          <ProtectedRoute>
            <EventApply />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id/confirm",
        Component: () => (
          <ProtectedRoute>
            <EventConfirm />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/:id/cancel-complete",
        Component: () => (
          <ProtectedRoute>
            <EventCancelCompletePage />
          </ProtectedRoute>
        ),
      },
       {
        path: "user/registrations",
        Component: () => (
          <ProtectedRoute>
            <UserRegistrationsPage />
          </ProtectedRoute>
        ),
      },
       {
        path: "/user/created-events",
        Component: () => (
          <ProtectedRoute>
            <UserCreatedEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        Component: AuthPage,
      },
      {
        path: "register",
        Component: AuthPage,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);

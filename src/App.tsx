import {createBrowserRouter, Navigate, RouterProvider} from "react-router";
import Layout from "./components/layout";
import EventList from "./pages/event-list";
import EventDetail from "./pages/event-detail";
import EventApply from "./pages/event-apply";
import EventConfirm from "./pages/event-confirm";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/not-found";
// Tanstack Queryのデバッグツール
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import AuthPage from "./pages/AuthPage";

export default function App() {
  // return <RouterProvider router={router} />;
  return (
    <>
      <RouterProvider router={router} />{" "}
      {/* 開発環境のみでデバッグツールを表示 */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </>
  );
}

const router = createBrowserRouter([
  {
    Component: Layout,
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
        path: "events/:id",
        Component: EventDetail,
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

import { onRequest as __api_events__id__update_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/events/[id]/update.ts"
import { onRequest as __api_auth_session_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/auth/session.ts"
import { onRequest as __api_auth_sign_in_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/auth/sign-in.ts"
import { onRequest as __api_auth_sign_out_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/auth/sign-out.ts"
import { onRequest as __api_auth_sign_up_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/auth/sign-up.ts"
import { onRequest as __api_events_create_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/events/create.ts"
import { onRequest as __api_events__id__ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/events/[id].ts"
import { onRequest as __api_events_ts_onRequest } from "/Users/iwatamini/Desktop/MyPractice/demo-react-event-calendar/functions/api/events.ts"

export const routes = [
    {
      routePath: "/api/events/:id/update",
      mountPath: "/api/events/:id",
      method: "",
      middlewares: [],
      modules: [__api_events__id__update_ts_onRequest],
    },
  {
      routePath: "/api/auth/session",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_session_ts_onRequest],
    },
  {
      routePath: "/api/auth/sign-in",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_sign_in_ts_onRequest],
    },
  {
      routePath: "/api/auth/sign-out",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_sign_out_ts_onRequest],
    },
  {
      routePath: "/api/auth/sign-up",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_sign_up_ts_onRequest],
    },
  {
      routePath: "/api/events/create",
      mountPath: "/api/events",
      method: "",
      middlewares: [],
      modules: [__api_events_create_ts_onRequest],
    },
  {
      routePath: "/api/events/:id",
      mountPath: "/api/events",
      method: "",
      middlewares: [],
      modules: [__api_events__id__ts_onRequest],
    },
  {
      routePath: "/api/events",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_events_ts_onRequest],
    },
  ]
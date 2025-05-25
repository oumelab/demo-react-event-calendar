// lib/auth.ts (Better Auth CLI専用)
import { betterAuth } from "better-auth";
// import { createId } from "@paralleldrive/cuid2";
import Database from "better-sqlite3";
 
export const auth = betterAuth({
  database: new Database("./db/event_app.db"),
});
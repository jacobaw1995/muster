import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your project's values.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Required for magic-link/email-change redirects to sign the user in
    // automatically once the browser lands back here with tokens in the URL.
    detectSessionInUrl: true,
  },
});

/**
 * True only when this page load's URL still carries the auth tokens Supabase
 * puts in the hash fragment for magic-link, email-change, and OAuth redirects
 * (`#access_token=...`). Captured synchronously at import time — before
 * `createClient`'s own async URL-detection can consume and strip the hash —
 * so it's a reliable "did we just land here via an emailed link" signal
 * regardless of when SessionContext's effects get around to subscribing.
 */
export const hadAuthRedirectHash =
  typeof window !== "undefined" && window.location.hash.includes("access_token=");

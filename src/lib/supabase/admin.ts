import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { requireEnv } from "../env";
import { supabaseFetch } from "./fetch";

export function createAdminClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: supabaseFetch,
      },
    },
  );
}

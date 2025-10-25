import { createClient as createBrowserClient } from "@supabase/supabase-js";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

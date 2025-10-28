// src/utils/supabase/server.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ サービスロールキーを第2引数に
    {
      auth: { persistSession: false },
      db: { schema: "public" },
    }
  );
};
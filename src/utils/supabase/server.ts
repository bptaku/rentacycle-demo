// ✅ サーバー側（API / 管理画面で使用）
// 利用キー：SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false },
    db: { schema: "public" },
  }
);
import { supabaseServer } from "@/utils/supabase/server";

export async function GET() {
  const { data, error } = await supabaseServer.from("reservations").select("*").limit(1);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, count: data?.length || 0 }), { status: 200 });
}

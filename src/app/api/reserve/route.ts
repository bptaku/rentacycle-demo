import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 最低限のバリデーション（必要に応じて強化OK）
    if (!payload.plan) return Response.json({ success: false, message: "plan は必須です" }, { status: 400 });
    if (!payload.start_date) return Response.json({ success: false, message: "start_date は必須です" }, { status: 400 });
    if (!payload.bikes || typeof payload.bikes !== "object") {
      return Response.json({ success: false, message: "bikes は必須です" }, { status: 400 });
    }
    if (typeof payload.total_price !== "number") {
      return Response.json({ success: false, message: "total_price は数値で必須です" }, { status: 400 });
    }

    // Supabaseへ保存
    const { error } = await supabase.from("reservations").insert([payload]);
    if (error) throw error;

    return Response.json({ success: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return Response.json({ success: false, message: e.message || String(e) }, { status: 500 });
  }
}

import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id)
      return Response.json({ success: false, message: "予約IDは必須です" }, { status: 400 });

    // Supabaseから予約を削除（トリガーで在庫が戻る）
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) throw error;

    return Response.json(
      { success: true, message: "予約をキャンセルしました（在庫を復元しました）" },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[/api/cancel] Error:", e);
    return Response.json(
      { success: false, message: e.message || String(e) },
      { status: 500 }
    );
  }
}

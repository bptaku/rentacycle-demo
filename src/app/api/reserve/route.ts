import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // 🧩 基本バリデーション
    if (!payload.plan)
      return Response.json({ success: false, message: "plan は必須です" }, { status: 400 });
    if (!payload.start_date || !payload.end_date)
      return Response.json({ success: false, message: "start_date / end_date は必須です" }, { status: 400 });
    if (!payload.bikes || typeof payload.bikes !== "object")
      return Response.json({ success: false, message: "bikes は必須です" }, { status: 400 });
    if (typeof payload.total_price !== "number")
      return Response.json({ success: false, message: "total_price は数値で必須です" }, { status: 400 });

    const bike_type = payload.plan;
    const request_qty = Number(payload.bikes?.[bike_type] || 0);

    // 🧭 ① Supabase RPC: 在庫チェック
    const { data: availability, error: rpcError } = await supabase.rpc("check_availability_with_period_v3_3", {
      bike_type,
      start_date: payload.start_date,
      end_date: payload.end_date,
      request_qty,
    });

    if (rpcError) throw rpcError;

    if (!availability) {
      // 在庫不足の場合
      return Response.json(
        { success: false, message: "在庫が不足しています" },
        { status: 409 } // Conflict
      );
    }

    // 🧭 ② Supabase: 予約データのINSERT
    const { error: insertError } = await supabase.from("reservations").insert([payload]);
    if (insertError) throw insertError;

    // トリガー decrease_stock_after_reservation_v3_4() が自動で在庫減算を行う

    return Response.json(
      { success: true, message: "予約が確定しました" },
      { status: 200 }
    );

  } catch (e: any) {
    console.error("[/api/reserve] Error:", e);
    return Response.json(
      { success: false, message: e.message || String(e) },
      { status: 500 }
    );
  }
}


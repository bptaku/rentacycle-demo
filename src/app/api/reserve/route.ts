import { supabaseServer } from "@/utils/supabase/server";

/**
 * 🚲 /api/reserve
 * v5.0 — 予約登録 + 在庫同期
 * ------------------------------------
 * ✅ SupabaseのreservationsにINSERT
 * ✅ decrease_stock_after_reservation_v5_0()トリガーで在庫更新
 * ✅ 料金・オプション内訳も保存
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      plan,
      start_date,
      end_date,
      start_time,
      pickup_time,
      bikes,
      addonsByBike,
      subtotal,
      addons_price,
      discount,
      total_price,
      name,
      email,
      paid = false,
    } = body;

    // 🔍 バリデーション
    if (!plan || !start_date || !end_date || !bikes || Object.keys(bikes).length === 0) {
      return Response.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer;

    // 🧠 INSERT処理
    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          plan,
          start_date,
          end_date,
          start_time,
          pickup_time,
          bikes, // jsonb
          addons: addonsByBike || {},
          subtotal,
          addons_price,
          discount,
          total_price,
          name,
          email,
          paid,
          status: "reserved",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Reserve insert error:", error);
      return Response.json(
        { success: false, message: error.message || "Insert failed" },
        { status: 500 }
      );
    }

    // 🎉 成功レスポンス
    return Response.json(
      {
        success: true,
        message: "Reservation saved successfully",
        data: data[0],
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("Reserve API Error:", err);
    return Response.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

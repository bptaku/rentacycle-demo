import { supabaseServer } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * 予約情報取得API（キャンセル申請ページ用）
 * 予約IDを受け取り、予約情報を返す
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "missing_id", message: "予約IDが指定されていません" }, { status: 400 });
    }

    const supabase = supabaseServer;

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(
        `
        id,
        name,
        email,
        start_date,
        end_date,
        start_time,
        pickup_time,
        plan,
        status,
        cancel_requested,
        total_price
      `
      )
      .eq("id", id)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: "reservation_not_found", message: "予約情報が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (err: any) {
    console.error("Reservation info API error:", err);
    return NextResponse.json(
      { error: "server_error", message: err?.message || "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}


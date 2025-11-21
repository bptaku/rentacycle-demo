import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

/**
 * キャンセル承認API
 * 管理者がキャンセル申請を承認し、予約をキャンセル状態にする
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json({ status: "error", message: "missing id" }, { status: 400 });
    }

    const supabase = supabaseServer;

    // 現在の予約データ取得
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, status, cancel_requested")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ status: "error", message: "not found" }, { status: 404 });
    }

    // 既にキャンセル済みの場合
    if (reservation.status === "canceled") {
      return NextResponse.json(
        { status: "already_canceled", message: "既にキャンセル済みです" },
        { status: 200 }
      );
    }

    // キャンセル申請がない場合
    if (!reservation.cancel_requested) {
      return NextResponse.json(
        { status: "error", message: "キャンセル申請がありません" },
        { status: 400 }
      );
    }

    // キャンセルを承認（ステータスをcanceledに更新）
    // Triggerが自動的に在庫を復元する
    const { data, error } = await supabase
      .from("reservations")
      .update({
        status: "canceled",
        // キャンセル申請フラグは残しておく（承認済みであることを記録）
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      console.error("[POST cancel-approve]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", reservation: data });
  } catch (error: any) {
    console.error("[POST cancel-approve]", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}


import { supabaseServer } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * キャンセル申請API
 * 予約IDを受け取り、キャンセル申請を登録する
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, reason } = body as { id?: string; reason?: string };

    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const supabase = supabaseServer;

    // 現在の予約データ取得
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, status, cancel_requested")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: "reservation_not_found" }, { status: 404 });
    }

    // 既にキャンセル済みの場合はエラー
    if (reservation.status === "canceled") {
      return NextResponse.json(
        { error: "already_canceled", message: "この予約は既にキャンセル済みです" },
        { status: 400 }
      );
    }

    // 既にキャンセル申請済みの場合はスキップ
    if (reservation.cancel_requested) {
      return NextResponse.json(
        { status: "already_requested", message: "既にキャンセル申請が登録されています" },
        { status: 200 }
      );
    }

    // キャンセル申請を登録
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        cancel_requested: true,
        cancel_requested_at: new Date().toISOString(),
        cancel_reason: reason || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Cancel request update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        status: "success",
        message: "キャンセル申請を承りました。承認までお待ちください。",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cancel request API error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}


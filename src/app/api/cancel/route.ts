import { supabaseServer } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return Response.json({ error: "missing_id" }, { status: 400 });
    }

    const supabase = supabaseServer;

    // 現在の予約データ取得
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return Response.json({ error: "reservation_not_found" }, { status: 404 });
    }

    // ステータスが既にキャンセル済みならスキップ
    if (reservation.status === "canceled") {
      return Response.json(
        { status: "skipped", message: "already_canceled" },
        { status: 200 }
      );
    }

    // ステータス更新（Triggerが在庫復元を実行）
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "canceled" })
      .eq("id", id);

    if (updateError) {
      console.error("Cancel update error:", updateError);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json(
      { status: "success", restored: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cancel API error:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

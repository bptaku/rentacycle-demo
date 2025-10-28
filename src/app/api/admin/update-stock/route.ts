import { supabaseServer } from "@/utils/supabase/server";


export async function POST(req: Request) {
  const { date, bike_type, delta } = await req.json()

  // 1️⃣ 対象レコード取得（base_quantityを必ず含む）
  const { data: stock, error: fetchError } = await supabaseServer
    .from("stock")
    .select("id, base_quantity, manual_adjustment, reserved")
    .eq("date", date)
    .eq("bike_type", bike_type)
    .single()

  if (fetchError || !stock) {
    return Response.json({ status: "error", message: "stock record not found" }, { status: 404 })
  }

  // 2️⃣ manual_adjustment 更新
  const newAdjustment = (stock.manual_adjustment || 0) + delta

  const { error: updateError } = await supabaseServer
    .from("stock")
    .update({
      manual_adjustment: newAdjustment,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stock.id)

  if (updateError) {
    return Response.json({ status: "error", message: updateError.message }, { status: 500 })
  }

  // 3️⃣ available 再計算（base_quantityがnullなら0で計算）
  const available =
    (stock.base_quantity || 0) + newAdjustment - (stock.reserved || 0)

  return Response.json({
    status: "ok",
    bike_type,
    new_manual_adjustment: newAdjustment,
    reserved: stock.reserved || 0,
    available_quantity: available,
    updated_at: new Date().toISOString(),
  })
}

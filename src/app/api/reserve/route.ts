import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      plan,
      bikes,
      addons,
      subtotal,
      addons_price,
      discount,
      total_price,
      start_date,
      end_date,
      name,
      email,
      phone
    } = body;

    // 必須パラメータ検証
    if (!plan || !bikes || !start_date || !end_date || !name) {
      return Response.json({ error: "missing_parameters" }, { status: 400 });
    }

    const supabase = createClient();

    // 予約データをINSERT
    const { data, error } = await supabase
      .from("reservations")
      .insert([
        {
          plan,
          bikes,
          addons,
          subtotal,
          addons_price,
          discount,
          total_price,
          start_date,
          end_date,
          name,
          email,
          phone,
          status: "confirmed"
        }
      ])
      .select();

    if (error) {
      console.error("Reserve insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(
      { status: "success", reservation: data?.[0] },
      { status: 200 }
    );
  } catch (err) {
    console.error("Reserve API Error:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}

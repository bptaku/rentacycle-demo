import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

const DROPOFF_PRICE = 3000;

function parseBikes(bikes: Record<string, number> | string | null | undefined) {
  if (!bikes) return {} as Record<string, number>;
  if (typeof bikes === "string") {
    try {
      return JSON.parse(bikes);
    } catch {
      return {} as Record<string, number>;
    }
  }
  return bikes;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json({ status: "error", message: "missing id" }, { status: 400 });
    }

    const body = await req.json();
    const { dropoff } = body as { dropoff?: boolean };

    if (typeof dropoff !== "boolean") {
      return NextResponse.json({ status: "error", message: "invalid dropoff flag" }, { status: 400 });
    }

    const { data: reservation, error: fetchError } = await supabaseServer
      .from("reservations")
      .select("bikes, subtotal, addons_price, insurance_price, discount")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ status: "error", message: "not found" }, { status: 404 });
    }

    const bikes = parseBikes(reservation.bikes);
    const totalBikes = Object.values<number>(bikes).reduce((sum, count) => sum + (count || 0), 0);
    const dropoffPrice = dropoff ? DROPOFF_PRICE * totalBikes : 0;
    const baseSubtotal =
      (reservation.subtotal || 0) +
      (reservation.addons_price || 0) +
      (reservation.insurance_price || 0) +
      dropoffPrice;
    const discount = Math.min(reservation.discount || 0, baseSubtotal);
    const newTotalPrice = baseSubtotal - discount;

    const { data, error } = await supabaseServer
      .from("reservations")
      .update({
        dropoff,
        dropoff_price: dropoffPrice,
        total_price: newTotalPrice,
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH dropoff]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", reservation: data });
  } catch (error: any) {
    console.error("[PATCH dropoff]", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}

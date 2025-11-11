import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const reservationId = resolvedParams.id;

    if (!reservationId) {
      return NextResponse.json(
        { status: "error", message: "missing reservation id" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { bike_numbers } = body;

    if (!bike_numbers || typeof bike_numbers !== "object") {
      return NextResponse.json(
        { status: "error", message: "invalid bike_numbers payload" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("reservations")
      .update({ bike_numbers })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH bike-numbers]", error);
      return NextResponse.json(
        { status: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "ok", reservation: data });
  } catch (error: any) {
    console.error("[PATCH bike-numbers]", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}

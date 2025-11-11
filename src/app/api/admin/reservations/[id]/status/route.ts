import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/utils/supabase/server";

const VALID_STATUSES = ["reserved", "in_use", "dropoff_in_progress", "completed", "canceled"] as const;
type ReservationStatus = (typeof VALID_STATUSES)[number];

function buildWorkflow(dropoff: boolean): ReservationStatus[] {
  const base: ReservationStatus[] = dropoff
    ? ["reserved", "in_use", "dropoff_in_progress", "completed"]
    : ["reserved", "in_use", "completed"];
  return ["canceled", ...base];
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
    const { status: nextStatus } = body as { status?: ReservationStatus };

    if (!nextStatus || !VALID_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ status: "error", message: "invalid status" }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabaseServer
      .from("reservations")
      .select("status, dropoff")
      .eq("id", reservationId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ status: "error", message: "not found" }, { status: 404 });
    }

    const currentStatus = current.status as ReservationStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json({ status: "ok", reservation: current });
    }

    const workflow = buildWorkflow(Boolean(current.dropoff));
    if (!workflow.includes(nextStatus)) {
      return NextResponse.json({ status: "error", message: "invalid status transition" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("reservations")
      .update({ status: nextStatus })
      .eq("id", reservationId)
      .select()
      .single();

    if (error) {
      console.error("[PATCH status]", error);
      return NextResponse.json({ status: "error", message: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", reservation: data });
  } catch (error: any) {
    console.error("[PATCH status]", error?.message || error);
    return NextResponse.json(
      { status: "error", message: error?.message || "unknown error" },
      { status: 500 }
    );
  }
}

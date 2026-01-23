import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

// GET /api/receptionist/doctors/:id/appointments?from=...&to=...
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from") as string) : undefined;
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to") as string) : undefined;
  const includeCancelled = url.searchParams.get("includeCancelled") === "1";

  const where: any = { doctorId: params.id };
  if (from || to) {
    where.dateTime = {};
    if (from) where.dateTime.gte = from;
    if (to) where.dateTime.lte = to;
  }
  if (!includeCancelled) where.status = { not: "CANCELLED" };

  const rows = await prisma.appointment.findMany({
    where,
    include: { patient: true, receptionist: { include: { user: true } } },
    orderBy: { dateTime: "asc" },
    take: 1000,
  });

  return NextResponse.json(rows);
}

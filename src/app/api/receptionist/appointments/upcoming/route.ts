import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

// GET /api/receptionist/appointments/upcoming
export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = new Date(url.searchParams.get("from") ?? new Date().toISOString());
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;
  const take = Math.min(Number(url.searchParams.get("take") ?? 200), 500);

  const where: any = { dateTime: { gte: from } };
  if (to) where.dateTime.lte = to;

  const rows = await prisma.appointment.findMany({
    where,
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { dateTime: "asc" },
    take,
  });

  return NextResponse.json(rows);
}

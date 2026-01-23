import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

// GET /api/receptionist/appointments/today
export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const rows = await prisma.appointment.findMany({
    where: { dateTime: { gte: start, lte: end } },
    include: { patient: true, doctor: { include: { user: true } } },
    orderBy: { dateTime: "asc" },
  });

  return NextResponse.json(rows);
}

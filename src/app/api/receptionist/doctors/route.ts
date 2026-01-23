import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

// GET /api/receptionist/doctors
export async function GET(req: Request) {
  try {
    await requirePermission(req, "doctors.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 200,
  });

  return NextResponse.json(doctors);
}

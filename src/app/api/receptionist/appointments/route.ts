import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

// POST /api/receptionist/appointments
// GET  /api/receptionist/appointments
export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 200), 500);
  const skip = Number(url.searchParams.get("skip") ?? 0);
  const doctorId = url.searchParams.get("doctorId") ?? undefined;
  const patientId = url.searchParams.get("patientId") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const where: any = {};
  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;
  if (from || to) {
    where.dateTime = {};
    if (from) where.dateTime.gte = new Date(from);
    if (to) where.dateTime.lte = new Date(to);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      receptionist: { include: { user: true } },
    },
    orderBy: { dateTime: "desc" },
    take,
    skip,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  let receptionistId: string | null = null;

  try {
    const res = await requirePermission(req, "appointments.create");
    actorId = res.session?.user?.id ?? null;

    if (actorId) {
      const receptionist = await prisma.receptionist.findUnique({ where: { userId: actorId } });
      receptionistId = receptionist?.id ?? null;
    }
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.patientId || !body.doctorId || !body.dateTime || !body.reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: body.patientId,
      doctorId: body.doctorId,
      receptionistId,
      dateTime: new Date(body.dateTime),
      reason: body.reason,
      notes: body.notes || null,
      status: "SCHEDULED",
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  await createAudit({ actorId, action: "receptionist.appointment.create", resource: "Appointment", resourceId: appointment.id, meta: { patientId: appointment.patientId, doctorId: appointment.doctorId, dateTime: appointment.dateTime } });

  return NextResponse.json(appointment);
}

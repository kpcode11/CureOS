import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      receptionist: { include: { user: true } },
    },
  });

  if (!appointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  return NextResponse.json(appointment);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "appointments.update");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (body.dateTime) data.dateTime = new Date(body.dateTime);
  if (body.reason) data.reason = body.reason;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.doctorId) data.doctorId = body.doctorId;

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No updatable fields" }, { status: 400 });

  const before = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  const updated = await prisma.appointment.update({ where: { id: params.id }, data, include: { patient: true, doctor: { include: { user: true } } } });

  await createAudit({ actorId, action: "receptionist.appointment.update", resource: "Appointment", resourceId: params.id, before, after: updated, meta: data });

  return NextResponse.json(updated);
}
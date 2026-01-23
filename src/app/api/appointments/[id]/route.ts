import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: {
        include: {
          user: true,
        },
      },
      receptionist: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(appointment);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actorId: string | null = null;

  try {
    const res = await requirePermission(req, "appointments.update");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.dateTime && { dateTime: new Date(body.dateTime) }),
      ...(body.reason && { reason: body.reason }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status && { status: body.status }),
    },
    include: {
      patient: true,
      doctor: {
        include: {
          user: true,
        },
      },
    },
  });

  await createAudit({
    actorId,
    action: "appointment.update",
    resource: "Appointment",
    resourceId: appointment.id,
    meta: body,
  });

  return NextResponse.json(appointment);
}

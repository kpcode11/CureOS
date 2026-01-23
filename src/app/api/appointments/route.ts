import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointments.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
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
    orderBy: {
      dateTime: "desc",
    },
    take: 200,
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  let receptionistId: string | null = null;

  try {
    const res = await requirePermission(req, "appointments.create");
    actorId = res.session?.user?.id ?? null;

    // Get receptionist ID if user is a receptionist
    if (actorId) {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: actorId },
      });
      receptionistId = receptionist?.id ?? null;
    }
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.patientId || !body.doctorId || !body.dateTime || !body.reason) {
    return NextResponse.json(
      {
        error: "Missing required fields: patientId, doctorId, dateTime, reason",
      },
      { status: 400 },
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: body.patientId,
      doctorId: body.doctorId,
      receptionistId: receptionistId,
      dateTime: new Date(body.dateTime),
      reason: body.reason,
      notes: body.notes || null,
      status: "SCHEDULED",
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
    action: "appointment.create",
    resource: "Appointment",
    resourceId: appointment.id,
    meta: {
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      dateTime: appointment.dateTime,
    },
  });

  return NextResponse.json(appointment);
}

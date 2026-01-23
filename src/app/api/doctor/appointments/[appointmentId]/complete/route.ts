import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor, writeAudit, getRequestIp } from "@/lib/doctorAuth";
import { AppointmentStatus } from "@prisma/client";

type Params = { params: { appointmentId: string } };

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, doctor } = await requireDoctor(req);

    const appt = await prisma.appointment.findFirst({
      where: { id: params.appointmentId, doctorId: doctor.id },
    });

    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appt.status !== AppointmentStatus.SCHEDULED) {
      return NextResponse.json(
        { error: "Only SCHEDULED appointments can be completed" },
        { status: 400 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status: AppointmentStatus.COMPLETED,
        notes: appt.notes ? `${appt.notes}\n[Completed]` : "[Completed]",
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "APPOINTMENT_COMPLETED",
      resource: "Appointment",
      resourceId: appt.id,
      before: { status: appt.status, notes: appt.notes },
      after: { status: updated.status, notes: updated.notes },
      ip: getRequestIp(req),
    });

    return NextResponse.json({ message: "Appointment completed", appointment: updated });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

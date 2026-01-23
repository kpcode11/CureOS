import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor, writeAudit, getRequestIp } from "@/lib/doctorAuth";
import { AppointmentStatus } from "@prisma/client";

type Params = { params: { appointmentId: string } };

const START_MARKER = "[Consultation started]";

export async function POST(req: Request, { params }: Params) {
  try {
    const { user, doctor } = await requireDoctor(req);

    const appt = await prisma.appointment.findFirst({
      where: { id: params.appointmentId, doctorId: doctor.id },
    });

    if (!appt) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const alreadyStarted = (appt.notes ?? "").includes(START_MARKER);

    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        notes: alreadyStarted
          ? appt.notes
          : appt.notes
          ? `${appt.notes}\n${START_MARKER}`
          : START_MARKER,
        status: AppointmentStatus.SCHEDULED, // keep enum-safe
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "APPOINTMENT_STARTED",
      resource: "Appointment",
      resourceId: appt.id,
      before: { status: appt.status, notes: appt.notes },
      after: { status: updated.status, notes: updated.notes },
      ip: getRequestIp(req),
    });

    return NextResponse.json({
      message: alreadyStarted ? "Consultation already started" : "Consultation started",
      appointment: updated,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

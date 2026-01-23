import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor, writeAudit, getRequestIp } from "@/lib/doctorAuth";

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

    const body = await req.json();
    const medications = body?.medications;
    const instructions: string = (body?.instructions ?? "").trim();

    if (!medications || !instructions) {
      return NextResponse.json(
        { error: "medications (Json) and instructions are required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: appt.patientId,
        doctorId: doctor.id,
        medications,
        instructions,
        dispensed: false,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "PRESCRIPTION_CREATED",
      resource: "Prescription",
      resourceId: prescription.id,
      meta: { appointmentId: appt.id, patientId: appt.patientId },
      ip: getRequestIp(req),
    });

    return NextResponse.json({ message: "Prescription created", prescription });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

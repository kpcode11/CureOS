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
    const diagnosis: string = (body?.diagnosis ?? "").trim();
    const symptoms: string = (body?.symptoms ?? "").trim();
    const vitals = body?.vitals ?? null;
    const notes: string | null = body?.notes ?? null;
    const attachments: string[] = Array.isArray(body?.attachments) ? body.attachments : [];

    if (!diagnosis || !symptoms) {
      return NextResponse.json(
        { error: "diagnosis and symptoms are required" },
        { status: 400 }
      );
    }

    // IMPORTANT: We only link EMR to patientId because DB doesn't expose appointment relation.
    // Also store doctor in notes for traceability (hackathon-friendly).
    const emr = await prisma.eMR.create({
      data: {
        patientId: appt.patientId,
        diagnosis,
        symptoms,
        vitals,
        notes: notes ? `${notes}\n[DoctorId: ${doctor.id}]` : `[DoctorId: ${doctor.id}]`,
        attachments,
      },
    });

    await writeAudit({
      actorId: user.id,
      action: "EMR_CREATED",
      resource: "EMR",
      resourceId: emr.id,
      meta: { appointmentId: appt.id, patientId: appt.patientId, doctorId: doctor.id },
      ip: getRequestIp(req),
    });

    return NextResponse.json({ message: "EMR saved", emr });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

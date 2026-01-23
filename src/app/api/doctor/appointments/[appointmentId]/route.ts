import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor } from "@/lib/doctorAuth";

type Params = { params: { appointmentId: string } };

export async function GET(req: Request, { params }: Params) {
  try {
    const { doctor } = await requireDoctor(req);

    // 1) Appointment + patient + receptionist (only relations that exist today)
    const appointment = await prisma.appointment.findFirst({
      where: { id: params.appointmentId, doctorId: doctor.id },
      include: {
        patient: true,
        receptionist: {
          include: { user: { select: { name: true, email: true } } },
        },
        doctor: true, // optional but usually exists
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // 2) Pull clinical/ops records by patientId (works even without appointment relations)
    const patientId = appointment.patientId;

    const [emrs, labTests, prescriptions, billings] = await Promise.all([
      prisma.eMR.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.labTest.findMany({
        where: { patientId },
        orderBy: { orderedAt: "desc" },
        take: 20,
      }),
      prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.billing.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      appointment,
      related: {
        emrs,
        labTests,
        prescriptions,
        billings,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

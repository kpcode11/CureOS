import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDoctor, writeAudit, getRequestIp } from "@/lib/doctorAuth";
import { LabTestStatus, BillingStatus } from "@prisma/client";

type Params = { params: { appointmentId: string } };

function normalizeTests(input: any): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((t) => (typeof t === "string" ? t : t?.testType))
    .filter((t) => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
}

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
    const tests = normalizeTests(body?.tests);

    if (tests.length === 0) {
      return NextResponse.json({ error: "tests[] is required" }, { status: 400 });
    }

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 1);

    const PER_TEST_FEE = Number(process.env.DEFAULT_LAB_TEST_FEE ?? 300);
    const total = tests.length * PER_TEST_FEE;

    const result = await prisma.$transaction(async (tx) => {
      // Create lab tests (patient-linked)
      await tx.labTest.createMany({
        data: tests.map((testType) => ({
          patientId: appt.patientId,
          testType,
          status: LabTestStatus.PENDING,
          orderedAt: now,
        })),
      });

      // Create a single billing entry for lab bundle
      const billing = await tx.billing.create({
        data: {
          patientId: appt.patientId,
          amount: total,
          description: `Lab Tests: ${tests.join(", ")} [DoctorId: ${doctor.id}]`,
          status: BillingStatus.PENDING,
          dueDate: due,
        },
      });

      return { billing };
    });

    await writeAudit({
      actorId: user.id,
      action: "LAB_ORDERED",
      resource: "Appointment",
      resourceId: appt.id,
      meta: { tests, billingId: result.billing.id, patientId: appt.patientId },
      ip: getRequestIp(req),
    });

    return NextResponse.json({
      message: "Lab tests ordered",
      labTestsCreated: tests.length,
      billing: result.billing,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

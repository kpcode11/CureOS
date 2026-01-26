import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";
import { SeverityLevel, ProblemCategory } from "@/types/scheduling";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointment.read");
  } catch (err) {
    console.error("[Appointment GET] Permission denied:", err);
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
    const res = await requirePermission(req, "appointment.create");
    actorId = res.session?.user?.id ?? null;

    // Get receptionist ID if user is a receptionist
    if (actorId) {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: actorId },
      });
      receptionistId = receptionist?.id ?? null;
    }
  } catch (err) {
    console.error("[Appointment POST] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.patientId || !body.doctorId || !body.dateTime || !body.reason) {
    console.error("[Appointment POST] Missing fields:", {
      patientId: body.patientId,
      doctorId: body.doctorId,
      dateTime: body.dateTime,
      reason: body.reason,
    });
    return NextResponse.json(
      {
        error: "Missing required fields: patientId, doctorId, dateTime, reason",
      },
      { status: 400 },
    );
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        receptionistId: receptionistId,
        dateTime: new Date(body.dateTime),
        reason: body.reason,
        notes: body.notes || null,
        status: "SCHEDULED",
        // Smart scheduling fields (optional)
        severity: body.severity as SeverityLevel | undefined,
        problemCategory: body.problemCategory as ProblemCategory | undefined,
        symptoms: body.symptoms || [],
        wasAutoAssigned: body.wasAutoAssigned || false,
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

    // Create consultation fee billing record
    const consultationFee = 1000; // ₹1000 consultation fee
    const dueDate = new Date(appointment.dateTime);
    dueDate.setDate(dueDate.getDate() + 7); // Due 7 days after appointment

    await prisma.billing.create({
      data: {
        patientId: body.patientId,
        amount: consultationFee,
        description: `Consultation with Dr. ${appointment.doctor.user.name} - ${body.reason}`,
        status: "PENDING",
        dueDate: dueDate,
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
        consultationFee,
      },
    });

    console.log("[Appointment POST] Successfully created:", appointment.id);
    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[Appointment POST] Creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create appointment", details: String(error) },
      { status: 500 },
    );
  }
}

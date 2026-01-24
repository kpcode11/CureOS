import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * GET /api/doctor/patients/:id
 * Get detailed patient information including EMR and prescription history
 *
 * RBAC: patient.read
 * Edge cases handled:
 * - Patient doesn't exist
 * - Doctor accessing patient they don't have records for
 * - Invalid patient ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "patient.read");
  } catch (err) {
    console.error("[Doctor GET /patients/:id] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: patientId } = await params;

    // Validate patient ID
    if (!patientId || patientId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 },
      );
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json(
        { error: "Doctor ID not found in session" },
        { status: 400 },
      );
    }

    // Get doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    // Get patient with all related data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          where: { doctorId: doctor.id },
          select: {
            id: true,
            dateTime: true,
            reason: true,
            status: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { dateTime: "desc" },
          take: 50,
        },
        prescriptions: {
          where: { doctorId: doctor.id },
          select: {
            id: true,
            medications: true,
            instructions: true,
            dispensed: true,
            dispensedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        emrRecords: {
          select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            vitals: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        labTests: {
          select: {
            id: true,
            testType: true,
            status: true,
            results: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        bedAssignments: {
          select: {
            id: true,
            bedId: true,
            assignedAt: true,
            dischargedAt: true,
            createdAt: true,
          },
          orderBy: { assignedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Audit log for patient access
    await createAudit({
      actorId: doctorUserId,
      action: "doctor.patient.view",
      resource: "Patient",
      resourceId: patientId,
      meta: { patientName: `${patient.firstName} ${patient.lastName}` },
    });

    return NextResponse.json(patient);
  } catch (err) {
    console.error("[Doctor GET /patients/:id] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

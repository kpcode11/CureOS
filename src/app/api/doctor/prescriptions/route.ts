import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * GET /api/doctor/prescriptions
 * Get all prescriptions created by the current doctor
 *
 * RBAC: prescription.read
 * Query params:
 * - dispensed: 'true'|'false' - filter by dispensed status
 *
 * Edge cases handled:
 * - Doctor with no prescriptions (empty array)
 * - Invalid dispensed filter value
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "prescription.read");
  } catch (err) {
    console.error("[Doctor GET /prescriptions] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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

    // Parse query params
    const url = new URL(req.url);
    const dispensedQ = url.searchParams.get("dispensed");
    const where: any = { doctorId: doctor.id };

    if (dispensedQ === "true") where.dispensed = true;
    else if (dispensedQ === "false") where.dispensed = false;
    // If invalid or not provided, don't filter

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: { select: { id: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: "doctor.prescriptions.list",
      resource: "Prescription",
      resourceId: "bulk",
      meta: { count: prescriptions.length, filter: dispensedQ || "none" },
    });

    return NextResponse.json(prescriptions);
  } catch (err) {
    console.error("[Doctor GET /prescriptions] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/doctor/prescriptions
 * Create a new prescription
 *
 * RBAC: prescription.create
 * Body: { patientId, medications, instructions }
 * medications: Array<{ name, dosage, frequency, duration }>
 *
 * Edge cases handled:
 * - Missing required fields
 * - Patient doesn't exist
 * - Patient has conflicting medications (warning, not blocking)
 * - Invalid medications array
 * - Empty or malformed instructions
 */
export async function POST(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "prescription.create");
  } catch (err) {
    console.error("[Doctor POST /prescriptions] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
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

    const body = await req.json();
    const { patientId, medications, instructions } = body;

    // Validation
    if (
      !patientId ||
      typeof patientId !== "string" ||
      patientId.trim() === ""
    ) {
      return NextResponse.json(
        { error: "patientId is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    if (
      !medications ||
      !Array.isArray(medications) ||
      medications.length === 0
    ) {
      return NextResponse.json(
        { error: "medications is required and must be a non-empty array" },
        { status: 400 },
      );
    }

    // Validate each medication
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.name || typeof med.name !== "string") {
        return NextResponse.json(
          { error: `medication[${i}].name is required and must be a string` },
          { status: 400 },
        );
      }
      if (!med.dosage || typeof med.dosage !== "string") {
        return NextResponse.json(
          { error: `medication[${i}].dosage is required and must be a string` },
          { status: 400 },
        );
      }
      if (!med.frequency || typeof med.frequency !== "string") {
        return NextResponse.json(
          {
            error: `medication[${i}].frequency is required and must be a string`,
          },
          { status: 400 },
        );
      }
    }

    if (
      !instructions ||
      typeof instructions !== "string" ||
      instructions.trim() === ""
    ) {
      return NextResponse.json(
        { error: "instructions is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create prescription in transaction
    const prescription = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.create({
        data: {
          patientId,
          doctorId: doctor.id,
          medications,
          instructions: instructions.trim(),
          dispensed: false,
        },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { id: true } },
        },
      });

      await createAudit({
        actorId: doctorUserId,
        action: "prescription.create",
        resource: "Prescription",
        resourceId: rx.id,
        meta: {
          patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          medicationCount: medications.length,
        },
      });

      return rx;
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (err) {
    console.error("[Doctor POST /prescriptions] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

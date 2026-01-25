import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * GET /api/doctor/patients
 * List patients with COMPLETED consultations for this doctor
 *
 * RBAC: patient.read
 * Query params:
 * - includeAll: 'true' to include all patients (not just completed consultations)
 * 
 * Edge cases handled:
 * - Non-doctor users (permission denied)
 * - Doctor with no patients (empty array)
 * - Database connection errors
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "patient.read");
  } catch (err) {
    console.error("[Doctor GET /patients] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const doctorId = sessionRes.session?.user?.id;
    if (!doctorId) {
      return NextResponse.json(
        { error: "Doctor ID not found in session" },
        { status: 400 },
      );
    }

    // Get the doctor profile to get doctorId (not userId)
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
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
    const includeAll = url.searchParams.get("includeAll") === "true";

    // Get patients with COMPLETED appointments with this doctor
    // This ensures only patients who have finished consultations appear
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          // Patients with completed appointments
          { 
            appointments: { 
              some: { 
                doctorId: doctor.id,
                ...(includeAll ? {} : { status: "COMPLETED" })
              } 
            } 
          },
          // Also include patients with prescriptions from this doctor
          { prescriptions: { some: { doctorId: doctor.id } } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        appointments: {
          where: { doctorId: doctor.id },
          select: { 
            id: true, 
            status: true, 
            dateTime: true,
            reason: true 
          },
          orderBy: { dateTime: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    // Create audit log for data access
    await createAudit({
      actorId: doctorId,
      action: "doctor.patients.list",
      resource: "Patient",
      resourceId: "bulk",
      meta: { count: patients.length },
    });

    return NextResponse.json(patients);
  } catch (err) {
    console.error("[Doctor GET /patients] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

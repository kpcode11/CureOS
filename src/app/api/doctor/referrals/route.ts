import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * POST /api/doctor/referrals
 * Create a new referral from current doctor to another doctor
 *
 * RBAC: referral.create (doctor permission)
 * Body:
 * - toDoctorId: target doctor ID
 * - patientId: patient ID
 * - reason: clinical reason for referral
 * - urgency: ROUTINE|URGENT|EMERGENCY
 * - clinicalNotes: optional clinical notes
 * - requestedTests: optional array of test names
 * - expiresAt: optional expiration date
 */
export async function POST(req: Request) {
  console.log("[POST /api/doctor/referrals] Handler called");
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "referral.create");
    console.log("[POST /api/doctor/referrals] Permission check passed");
  } catch (err) {
    console.log("[POST /api/doctor/referrals] Permission check failed:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    console.log("[POST /api/doctor/referrals] Request received");

    const userId = sessionRes.session?.user?.id;
    if (!userId) {
      console.log("[POST /api/doctor/referrals] No userId in session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current doctor
    const fromDoctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!fromDoctor) {
      console.log(
        "[POST /api/doctor/referrals] Doctor profile not found for userId:",
        userId,
      );
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    console.log("[POST /api/doctor/referrals] Doctor found:", fromDoctor.id);

    const body = await req.json();
    console.log("[POST /api/doctor/referrals] Body received:", body);
    const {
      toDoctorId,
      patientId,
      reason,
      urgency = "ROUTINE",
      clinicalNotes,
      requestedTests = [],
      expiresAt,
    } = body;

    // Validation
    if (!toDoctorId || !patientId || !reason) {
      console.log("[Referral Create] Validation failed:", {
        toDoctorId,
        patientId,
        reason,
        body,
      });
      return NextResponse.json(
        {
          error: "Missing required fields: toDoctorId, patientId, reason",
          received: { toDoctorId, patientId, reason },
        },
        { status: 400 },
      );
    }

    // Cannot refer to self
    if (toDoctorId === fromDoctor.id) {
      return NextResponse.json(
        { error: "Cannot refer patient to yourself" },
        { status: 400 },
      );
    }

    // Verify target doctor exists
    const toDoctor = await prisma.doctor.findUnique({
      where: { id: toDoctorId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!toDoctor) {
      return NextResponse.json(
        { error: "Target doctor not found" },
        { status: 404 },
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

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        fromDoctorId: fromDoctor.id,
        toDoctorId,
        patientId,
        reason,
        urgency,
        clinicalNotes,
        requestedTests,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "PENDING",
      },
      include: {
        fromDoctor: {
          include: { user: { select: { name: true, email: true } } },
        },
        toDoctor: {
          include: { user: { select: { name: true, email: true } } },
        },
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    // Audit log
    await createAudit({
      actorId: userId,
      action: "referral.create",
      resource: "Referral",
      resourceId: referral.id,
      meta: {
        toDoctorId,
        patientId,
        urgency,
      },
    });

    // TODO: Send notification to target doctor and receptionist
    // await sendReferralNotification(referral);

    return NextResponse.json(referral, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/doctor/referrals] Error:", err);
    console.error("[POST /api/doctor/referrals] Error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/doctor/referrals
 * Get referrals for current doctor (sent and received)
 *
 * Query params:
 * - type: 'sent'|'received' (default: both)
 * - status: 'PENDING'|'ACCEPTED'|'REJECTED'|'CONVERTED'|'EXPIRED'
 * - patientId: filter by patient
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "referral.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const userId = sessionRes.session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const patientId = url.searchParams.get("patientId");

    const where: any = {};

    // Filter by type
    if (type === "sent") {
      where.fromDoctorId = doctor.id;
    } else if (type === "received") {
      where.toDoctorId = doctor.id;
    } else {
      // Both sent and received
      where.OR = [{ fromDoctorId: doctor.id }, { toDoctorId: doctor.id }];
    }

    // Filter by status
    if (
      status &&
      ["PENDING", "ACCEPTED", "REJECTED", "CONVERTED", "EXPIRED"].includes(
        status,
      )
    ) {
      where.status = status;
    }

    // Filter by patient
    if (patientId) {
      where.patientId = patientId;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        fromDoctor: {
          include: { user: { select: { name: true, email: true } } },
        },
        toDoctor: {
          include: { user: { select: { name: true, email: true } } },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        appointment: {
          select: { id: true, dateTime: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    await createAudit({
      actorId: userId,
      action: "referral.list",
      resource: "Referral",
      resourceId: "bulk",
      meta: { count: referrals.length, type },
    });

    return NextResponse.json(referrals);
  } catch (err) {
    console.error("[GET /api/doctor/referrals] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

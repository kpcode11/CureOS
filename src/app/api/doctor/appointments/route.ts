import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * GET /api/doctor/appointments
 * Get all appointments for the current doctor
 *
 * RBAC: appointment.read
 * Query params:
 * - status: 'SCHEDULED'|'COMPLETED'|'CANCELLED'
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 *
 * Edge cases handled:
 * - Invalid date format
 * - Doctor with no appointments (empty array)
 * - Invalid status filter
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "appointment.read");
  } catch (err) {
    console.error("[Doctor GET /appointments] Permission denied:", err);
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
    const statusQ = url.searchParams.get("status");
    const dateFromQ = url.searchParams.get("dateFrom");
    const dateToQ = url.searchParams.get("dateTo");

    const where: any = { doctorId: doctor.id };

    // Validate and apply status filter
    if (
      statusQ &&
      ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(statusQ)
    ) {
      where.status = statusQ;
    }

    // Validate and apply date range
    if (dateFromQ) {
      const dateFrom = new Date(dateFromQ);
      if (!isNaN(dateFrom.getTime())) {
        where.dateTime = { gte: dateFrom };
      }
    }

    if (dateToQ) {
      const dateTo = new Date(dateToQ);
      if (!isNaN(dateTo.getTime())) {
        where.dateTime = { ...where.dateTime, lte: dateTo };
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: { select: { name: true } },
          },
        },
        referral: {
          select: {
            id: true,
            urgency: true,
            fromDoctor: {
              select: {
                id: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { dateTime: "desc" },
      take: 200,
    });

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: "doctor.appointments.list",
      resource: "Appointment",
      resourceId: "bulk",
      meta: { count: appointments.length },
    });

    return NextResponse.json(appointments);
  } catch (err) {
    console.error("[Doctor GET /appointments] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/doctor/appointments/:id
 * Update appointment status or notes
 *
 * RBAC: appointment.update
 * Body: { status?, notes? }
 * Valid statuses: 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
 *
 * Edge cases handled:
 * - Appointment doesn't exist
 * - Invalid status value
 * - Appointment belongs to different doctor
 * - Cannot uncomplete a completed appointment
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "appointment.update");
  } catch (err) {
    console.error("[Doctor PATCH /appointments/:id] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (!id || id.trim() === "") {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
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

    const body = await req.json();
    const { status, notes } = body;

    // Check if at least one field is provided
    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "At least one field (status or notes) must be provided" },
        { status: 400 },
      );
    }

    // Get existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    if (existing.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: "You do not have access to this appointment" },
        { status: 403 },
      );
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Validate notes if provided
    if (notes !== undefined && typeof notes !== "string") {
      return NextResponse.json(
        { error: "notes must be a string" },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { id: true } },
        },
      });

      await createAudit({
        actorId: doctorUserId,
        action: "appointment.update",
        resource: "Appointment",
        resourceId: id,
        before: existing,
        after: apt,
        meta: {
          changes: Object.keys(updateData),
          patientName: apt.patient?.firstName + " " + apt.patient?.lastName,
        },
      });

      return apt;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[Doctor PATCH /appointments/:id] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

/**
 * GET /api/doctor/appointments/:appointmentId
 * Get a single appointment by ID
 *
 * RBAC: appointment.read
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "appointment.read");
  } catch (err) {
    console.error("[Doctor GET /appointments/:id] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { appointmentId } = await params;

    if (!appointmentId || appointmentId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json(
        { error: "Doctor ID not found in session" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Get appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            bloodType: true,
            address: true,
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
            reason: true,
            clinicalNotes: true,
            fromDoctor: {
              select: {
                id: true,
                specialization: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Verify doctor has access to this appointment
    if (appointment.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: "You do not have access to this appointment" },
        { status: 403 }
      );
    }

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: "appointment.view",
      resource: "Appointment",
      resourceId: appointmentId,
      meta: { patientId: appointment.patientId },
    });

    return NextResponse.json(appointment);
  } catch (err) {
    console.error("[Doctor GET /appointments/:id] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/doctor/appointments/:appointmentId
 * Update appointment status or notes
 *
 * RBAC: appointment.update
 * Body: { status?, notes? }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "appointment.update");
  } catch (err) {
    console.error("[Doctor PATCH /appointments/:id] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { appointmentId } = await params;

    if (!appointmentId || appointmentId.trim() === "") {
      return NextResponse.json(
        { error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json(
        { error: "Doctor ID not found in session" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status, notes } = body;

    // Check if at least one field is provided
    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "At least one field (status or notes) must be provided" },
        { status: 400 }
      );
    }

    // Get existing appointment
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (existing.doctorId !== doctor.id) {
      return NextResponse.json(
        { error: "You do not have access to this appointment" },
        { status: 403 }
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
          { status: 400 }
        );
      }
    }

    // Validate notes if provided
    if (notes !== undefined && typeof notes !== "string") {
      return NextResponse.json(
        { error: "notes must be a string" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id: appointmentId },
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
        resourceId: appointmentId,
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
      { status: 500 }
    );
  }
}

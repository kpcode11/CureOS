import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, "referral.update");
  } catch (err) {
    console.error("[Doctor PATCH /referrals/:id] Permission denied:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id)
      return NextResponse.json(
        { error: "Invalid referral id" },
        { status: 400 },
      );

    const userId = sessionRes.session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure referral exists
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral)
      return NextResponse.json(
        { error: "Referral not found" },
        { status: 404 },
      );

    // Ensure current user is the receiving doctor for actions except maybe admin (enforce recipient)
    const doctorProfile = await prisma.doctor.findUnique({ where: { userId } });
    if (!doctorProfile)
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 },
      );

    if (referral.toDoctorId !== doctorProfile.id) {
      return NextResponse.json(
        { error: "You are not authorized to modify this referral" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const action = (body.action || "").toString().toLowerCase();

    if (action === "accept") {
      const updated = await prisma.referral.update({
        where: { id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
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

      await createAudit({
        actorId: userId,
        action: "referral.accept",
        resource: "Referral",
        resourceId: id,
        meta: { referralId: id },
      });
      return NextResponse.json(updated);
    }

    if (action === "reject") {
      const reason = body.reason ?? null;
      const updated = await prisma.referral.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectedReason: reason,
          rejectedAt: new Date(),
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

      await createAudit({
        actorId: userId,
        action: "referral.reject",
        resource: "Referral",
        resourceId: id,
        meta: { reason },
      });
      return NextResponse.json(updated);
    }

    if (action === "convert") {
      // Convert referral into an appointment. Expect appointment details in body.appointment
      const appointmentPayload = body.appointment || {};
      // Minimum required fields: dateTime
      if (!appointmentPayload.dateTime) {
        return NextResponse.json(
          { error: "Missing appointment.dateTime" },
          { status: 400 },
        );
      }

      // Create appointment and link referral in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointment.create({
          data: {
            patientId: referral.patientId,
            doctorId: doctorProfile.id,
            dateTime: new Date(appointmentPayload.dateTime),
            reason: appointmentPayload.reason ?? referral.reason,
            notes: appointmentPayload.notes ?? referral.clinicalNotes ?? null,
            status: "SCHEDULED",
          },
        });

        const updatedReferral = await tx.referral.update({
          where: { id },
          data: {
            status: "CONVERTED",
            appointmentId: appt.id,
            acceptedAt: new Date(),
          },
        });

        await createAudit({
          actorId: userId,
          action: "referral.convert",
          resource: "Referral",
          resourceId: id,
          meta: { appointmentId: appt.id },
        });

        return { appointment: appt, referral: updatedReferral };
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Doctor PATCH /referrals/:id] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * PATCH /api/referrals/[id]/accept
 * Accept a referral (by receptionist or target doctor)
 * 
 * RBAC: referral.accept
 * Body:
 * - notes: optional acceptance notes
 * - createAppointment: boolean - whether to auto-create appointment
 * - appointmentData: { dateTime, notes } - if createAppointment is true
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'referral.accept');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const userId = sessionRes.session?.user?.id;
    const userRole = sessionRes.session?.user?.role;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { notes, createAppointment = false, appointmentData } = body;

    // Get referral
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        toDoctor: { include: { user: true } },
        patient: true,
        fromDoctor: { include: { user: true } }
      }
    });

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    // Check if already processed
    if (referral.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Referral already ${referral.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Authorization: must be target doctor or receptionist
    let canAccept = false;
    if (userRole === 'RECEPTIONIST') {
      canAccept = true;
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (doctor && doctor.id === referral.toDoctorId) {
        canAccept = true;
      }
    }

    if (!canAccept) {
      return NextResponse.json(
        { error: 'Only the target doctor or receptionist can accept this referral' },
        { status: 403 }
      );
    }

    // Check expiration
    if (referral.expiresAt && new Date() > new Date(referral.expiresAt)) {
      await prisma.referral.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json({ error: 'Referral has expired' }, { status: 400 });
    }

    // Update referral
    const updatedReferral = await prisma.referral.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedBy: userId,
        acceptedAt: new Date(),
        clinicalNotes: notes ? `${referral.clinicalNotes || ''}\n\nAcceptance notes: ${notes}` : referral.clinicalNotes
      },
      include: {
        fromDoctor: { include: { user: { select: { name: true } } } },
        toDoctor: { include: { user: { select: { name: true } } } },
        patient: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Create appointment if requested
    let appointment = null;
    if (createAppointment && appointmentData?.dateTime) {
      appointment = await prisma.appointment.create({
        data: {
          patientId: referral.patientId,
          doctorId: referral.toDoctorId,
          referralId: referral.id,
          dateTime: new Date(appointmentData.dateTime),
          reason: `Referral from Dr. ${referral.fromDoctor.user.name}: ${referral.reason}`,
          notes: appointmentData.notes || referral.clinicalNotes,
          status: 'SCHEDULED'
        }
      });

      // Update referral to CONVERTED
      await prisma.referral.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          appointmentId: appointment.id
        }
      });
    }

    // Audit log
    await createAudit({
      actorId: userId,
      action: 'referral.accept',
      resource: 'Referral',
      resourceId: id,
      meta: {
        appointmentCreated: !!appointment,
        appointmentId: appointment?.id
      }
    });

    // TODO: Send notification to referring doctor
    // await sendReferralAcceptedNotification(updatedReferral);

    return NextResponse.json({
      referral: updatedReferral,
      appointment
    });
  } catch (err) {
    console.error('[PATCH /api/referrals/:id/accept] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

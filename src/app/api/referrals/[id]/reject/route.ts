import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * PATCH /api/referrals/[id]/reject
 * Reject a referral (by receptionist or target doctor)
 * 
 * RBAC: referral.reject
 * Body:
 * - reason: required rejection reason
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'referral.reject');
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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get referral
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        toDoctor: { include: { user: true } },
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
    let canReject = false;
    if (userRole === 'RECEPTIONIST') {
      canReject = true;
    } else if (userRole === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true }
      });
      if (doctor && doctor.id === referral.toDoctorId) {
        canReject = true;
      }
    }

    if (!canReject) {
      return NextResponse.json(
        { error: 'Only the target doctor or receptionist can reject this referral' },
        { status: 403 }
      );
    }

    // Update referral
    const updatedReferral = await prisma.referral.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason,
        rejectedAt: new Date(),
        acceptedBy: userId
      },
      include: {
        fromDoctor: { include: { user: { select: { name: true } } } },
        toDoctor: { include: { user: { select: { name: true } } } },
        patient: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Audit log
    await createAudit({
      actorId: userId,
      action: 'referral.reject',
      resource: 'Referral',
      resourceId: id,
      meta: { reason }
    });

    // TODO: Send notification to referring doctor
    // await sendReferralRejectedNotification(updatedReferral);

    return NextResponse.json(updatedReferral);
  } catch (err) {
    console.error('[PATCH /api/referrals/:id/reject] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

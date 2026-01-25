import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * GET /api/receptionist/referrals
 * Get pending referrals for receptionist to process
 * 
 * RBAC: referral.read
 * Query params:
 * - status: filter by status (default: PENDING)
 * - urgency: filter by urgency
 * - doctorId: filter by target doctor
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'referral.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const userId = sessionRes.session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'PENDING';
    const urgency = url.searchParams.get('urgency');
    const doctorId = url.searchParams.get('doctorId');

    const where: any = {};

    // Filter by status
    if (['PENDING', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'EXPIRED'].includes(status)) {
      where.status = status;
    }

    // Filter by urgency
    if (urgency && ['ROUTINE', 'URGENT', 'EMERGENCY'].includes(urgency)) {
      where.urgency = urgency;
    }

    // Filter by target doctor
    if (doctorId) {
      where.toDoctorId = doctorId;
    }

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        fromDoctor: {
          include: { user: { select: { name: true, email: true } } }
        },
        toDoctor: {
          include: { user: { select: { name: true, email: true } } }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true
          }
        },
        appointment: {
          select: { id: true, dateTime: true, status: true }
        }
      },
      orderBy: [
        { urgency: 'desc' }, // EMERGENCY first
        { createdAt: 'desc' }
      ],
      take: 100
    });

    await createAudit({
      actorId: userId,
      action: 'receptionist.referrals.list',
      resource: 'Referral',
      resourceId: 'bulk',
      meta: { count: referrals.length }
    });

    return NextResponse.json(referrals);
  } catch (err) {
    console.error('[GET /api/receptionist/referrals] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

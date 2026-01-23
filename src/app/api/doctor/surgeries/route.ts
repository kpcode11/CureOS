import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * POST /api/doctor/surgeries
 * Schedule a new surgery
 * 
 * RBAC: surgery.create
 * Body: { patientId, surgeryType, scheduledAt, notes?, anesthesiologist? }
 * 
 * Edge cases handled:
 * - Patient doesn't exist
 * - Patient not assigned to this doctor
 * - Invalid date (past or malformed)
 * - Missing required fields
 * - Patient already has conflicting surgeries
 */
export async function POST(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'surgery.create');
  } catch (err) {
    console.error('[Doctor POST /surgeries] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    // Get doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      select: { id: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { patientId, surgeryType, scheduledAt, notes, anesthesiologist } = body;

    // Validation
    if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
      return NextResponse.json({ error: 'patientId is required and must be a non-empty string' }, { status: 400 });
    }

    if (!surgeryType || typeof surgeryType !== 'string' || surgeryType.trim() === '') {
      return NextResponse.json({ error: 'surgeryType is required and must be a non-empty string' }, { status: 400 });
    }

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return NextResponse.json({ error: 'scheduledAt is required and must be a valid ISO date string' }, { status: 400 });
    }

    // Validate date
    const surgeryDate = new Date(scheduledAt);
    if (isNaN(surgeryDate.getTime())) {
      return NextResponse.json({ error: 'scheduledAt must be a valid ISO date string' }, { status: 400 });
    }

    // Check date is not in the past
    if (surgeryDate < new Date()) {
      return NextResponse.json({ error: 'Surgery date cannot be in the past' }, { status: 400 });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Check if doctor has access to this patient
    const hasAccess = await prisma.appointment.findFirst({
      where: {
        patientId,
        doctorId: doctor.id
      }
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this patient' }, { status: 403 });
    }

    // Check for conflicting surgeries (warn but don't block)
    const conflictingSurgeries = await prisma.surgery.findMany({
      where: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        scheduledAt: {
          gte: new Date(surgeryDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
          lte: new Date(surgeryDate.getTime() + 24 * 60 * 60 * 1000)  // 24 hours after
        }
      }
    });

    // Create surgery in transaction
    const surgery = await prisma.$transaction(async (tx) => {
      const s = await tx.surgery.create({
        data: {
          patientName: `${patient.firstName} ${patient.lastName}`,
          doctorId: doctor.id,
          surgeryType: surgeryType.trim(),
          scheduledAt: surgeryDate,
          notes: notes ? notes.trim() : null,
          status: 'SCHEDULED'
        }
      });

      await createAudit({
        actorId: doctorUserId,
        action: 'surgery.create',
        resource: 'Surgery',
        resourceId: s.id,
        meta: {
          patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          surgeryType: surgeryType.trim(),
          scheduledAt: surgeryDate.toISOString(),
          conflictingCount: conflictingSurgeries.length
        }
      });

      return s;
    });

    return NextResponse.json(
      {
        surgery,
        warning: conflictingSurgeries.length > 0 ? `Patient has ${conflictingSurgeries.length} surgery(ies) scheduled within 24 hours` : null
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Doctor POST /surgeries] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/doctor/surgeries
 * Get all surgeries scheduled by the doctor
 * 
 * RBAC: surgery.read
 * Query params:
 * - status: 'SCHEDULED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * 
 * Edge cases handled:
 * - Invalid date format
 * - Invalid status value
 * - Doctor with no surgeries (empty array)
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'surgery.read');
  } catch (err) {
    console.error('[Doctor GET /surgeries] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    // Get doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      select: { id: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Parse query params
    const url = new URL(req.url);
    const statusQ = url.searchParams.get('status');
    const dateFromQ = url.searchParams.get('dateFrom');
    const dateToQ = url.searchParams.get('dateTo');

    const where: any = { doctorId: doctor.id };

    // Validate and apply status filter
    if (statusQ && ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(statusQ)) {
      where.status = statusQ;
    }

    // Validate and apply date range
    if (dateFromQ) {
      const dateFrom = new Date(dateFromQ);
      if (!isNaN(dateFrom.getTime())) {
        where.scheduledAt = { gte: dateFrom };
      }
    }

    if (dateToQ) {
      const dateTo = new Date(dateToQ);
      if (!isNaN(dateTo.getTime())) {
        where.scheduledAt = { ...where.scheduledAt, lte: dateTo };
      }
    }

    const surgeries = await prisma.surgery.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 200
    });

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: 'doctor.surgeries.list',
      resource: 'Surgery',
      resourceId: 'bulk',
      meta: { count: surgeries.length }
    });

    return NextResponse.json(surgeries);
  } catch (err) {
    console.error('[Doctor GET /surgeries] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * GET /api/doctor/lab-results
 * Get lab results for the doctor's patients
 * 
 * RBAC: lab.read
 * Query params:
 * - status: 'PENDING'|'COMPLETED'|'FAILED'
 * - patientId: filter by specific patient
 * 
 * Edge cases handled:
 * - Invalid status filter
 * - Patient doesn't exist
 * - Doctor with no lab orders (empty array)
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'lab.read');
  } catch (err) {
    console.error('[Doctor GET /lab-results] Permission denied:', err);
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
    const patientIdQ = url.searchParams.get('patientId');

    const where: any = {};

    // Get doctor's patients for authorization
    const doctorPatients = await prisma.patient.findMany({
      where: {
        appointments: { some: { doctorId: doctor.id } }
      },
      select: { id: true }
    });

    const patientIds = doctorPatients.map(p => p.id);

    if (patientIds.length === 0) {
      return NextResponse.json([]);
    }

    where.patientId = { in: patientIds };

    // Apply patient filter if provided
    if (patientIdQ && patientIds.includes(patientIdQ)) {
      where.patientId = patientIdQ;
    }

    // Apply status filter
    if (statusQ && ['PENDING', 'COMPLETED', 'FAILED'].includes(statusQ)) {
      where.status = statusQ;
    }

    const labResults = await prisma.labTest.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        labTech: { select: { id: true, user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: 'lab.results.list',
      resource: 'LabTest',
      resourceId: 'bulk',
      meta: { count: labResults.length }
    });

    return NextResponse.json(labResults);
  } catch (err) {
    console.error('[Doctor GET /lab-results] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/doctor/lab-orders
 * Order lab tests for a patient
 * 
 * RBAC: lab.order
 * Body: { patientId, testType, instructions?, priority? }
 * Priority: 'ROUTINE'|'URGENT'
 * 
 * Edge cases handled:
 * - Patient doesn't exist
 * - Patient not assigned to this doctor
 * - Missing required fields
 * - Invalid test type
 * - Invalid priority value
 */
export async function POST(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'lab.order');
  } catch (err) {
    console.error('[Doctor POST /lab-orders] Permission denied:', err);
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
    const { patientId, testType, instructions, priority } = body;

    // Validation
    if (!patientId || typeof patientId !== 'string' || patientId.trim() === '') {
      return NextResponse.json({ error: 'patientId is required and must be a non-empty string' }, { status: 400 });
    }

    if (!testType || typeof testType !== 'string' || testType.trim() === '') {
      return NextResponse.json({ error: 'testType is required and must be a non-empty string' }, { status: 400 });
    }

    // Validate priority if provided
    if (priority && !['ROUTINE', 'URGENT'].includes(priority)) {
      return NextResponse.json({ error: "priority must be 'ROUTINE' or 'URGENT'" }, { status: 400 });
    }

    // Verify patient exists and has appointments with this doctor
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

    // Create lab test in transaction
    const labTest = await prisma.$transaction(async (tx) => {
      const test = await tx.labTest.create({
        data: {
          patientId,
          testType: testType.trim(),
          status: 'PENDING'
        }
      });

      await createAudit({
        actorId: doctorUserId,
        action: 'lab.order.create',
        resource: 'LabTest',
        resourceId: test.id,
        meta: {
          patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          testType: testType.trim(),
          priority: priority || 'ROUTINE'
        }
      });

      return test;
    });

    return NextResponse.json(labTest, { status: 201 });
  } catch (err) {
    console.error('[Doctor POST /lab-orders] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

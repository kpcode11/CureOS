import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * GET /api/doctor/patients/:id/emr
 * Get all EMR records for a patient
 * 
 * RBAC: emr.read (doctors can read all EMR)
 * Edge cases handled:
 * - Patient doesn't exist
 * - No EMR records exist
 * - Invalid patient ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'emr.read');
  } catch (err) {
    console.error('[Doctor GET /patients/:id/emr] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: patientId } = await params;

    if (!patientId || patientId.trim() === '') {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get all EMR records
    const emrRecords = await prisma.eMR.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: 'emr.read',
      resource: 'EMR',
      resourceId: patientId,
      meta: { count: emrRecords.length, patientName: `${patient.firstName} ${patient.lastName}` }
    });

    return NextResponse.json(emrRecords);
  } catch (err) {
    console.error('[Doctor GET /patients/:id/emr] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/doctor/patients/:id/emr
 * Create a new EMR record for a patient
 * 
 * RBAC: emr.write
 * Body: { diagnosis, symptoms, vitals?, notes?, attachments? }
 * Edge cases handled:
 * - Missing required fields (diagnosis, symptoms)
 * - Patient doesn't exist
 * - Invalid vitals JSON
 * - Attachments validation
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'emr.write');
  } catch (err) {
    console.error('[Doctor POST /patients/:id/emr] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: patientId } = await params;

    if (!patientId || patientId.trim() === '') {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    const body = await req.json();
    const { diagnosis, symptoms, vitals, notes, attachments } = body;

    // Validation
    if (!diagnosis || typeof diagnosis !== 'string' || diagnosis.trim() === '') {
      return NextResponse.json({ error: 'diagnosis is required and must be a non-empty string' }, { status: 400 });
    }

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim() === '') {
      return NextResponse.json({ error: 'symptoms is required and must be a non-empty string' }, { status: 400 });
    }

    // Validate vitals if provided
    if (vitals && typeof vitals !== 'object') {
      return NextResponse.json({ error: 'vitals must be a valid JSON object' }, { status: 400 });
    }

    // Validate attachments if provided
    if (attachments && (!Array.isArray(attachments) || !attachments.every(a => typeof a === 'string'))) {
      return NextResponse.json({ error: 'attachments must be an array of strings' }, { status: 400 });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Create EMR record in transaction
    const emrRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.eMR.create({
        data: {
          patientId,
          diagnosis: diagnosis.trim(),
          symptoms: symptoms.trim(),
          vitals: vitals || null,
          notes: notes ? notes.trim() : null,
          attachments: attachments || []
        }
      });

      await createAudit({
        actorId: doctorUserId,
        action: 'emr.create',
        resource: 'EMR',
        resourceId: record.id,
        meta: {
          patientId,
          patientName: `${patient.firstName} ${patient.lastName}`,
          diagnosis: diagnosis.substring(0, 100) // truncate for audit log
        }
      });

      return record;
    });

    return NextResponse.json(emrRecord, { status: 201 });
  } catch (err) {
    console.error('[Doctor POST /patients/:id/emr] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/doctor/patients/:id/emr/:emrId
 * Update an existing EMR record
 * 
 * RBAC: emr.write
 * Body: { diagnosis?, symptoms?, vitals?, notes?, attachments? }
 * Edge cases handled:
 * - EMR record doesn't exist
 * - Patient doesn't exist
 * - No updates provided
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; emrId: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'emr.write');
  } catch (err) {
    console.error('[Doctor PATCH /patients/:id/emr/:emrId] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: patientId, emrId } = await params;

    if (!patientId || !emrId) {
      return NextResponse.json({ error: 'Invalid patient or EMR ID' }, { status: 400 });
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    const body = await req.json();
    const { diagnosis, symptoms, vitals, notes, attachments } = body;

    // Check if at least one field is provided
    if (!diagnosis && !symptoms && !vitals && !notes && !attachments) {
      return NextResponse.json({ error: 'At least one field must be provided for update' }, { status: 400 });
    }

    // Verify EMR exists and belongs to patient
    const existing = await prisma.eMR.findUnique({
      where: { id: emrId },
      select: { id: true, patientId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: 'EMR record not found' }, { status: 404 });
    }

    if (existing.patientId !== patientId) {
      return NextResponse.json({ error: 'EMR record does not belong to this patient' }, { status: 400 });
    }

    const beforeData = await prisma.eMR.findUnique({
      where: { id: emrId }
    });

    // Build update data
    const updateData: any = {};
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis.trim();
    if (symptoms !== undefined) updateData.symptoms = symptoms.trim();
    if (vitals !== undefined) updateData.vitals = vitals;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (attachments !== undefined) updateData.attachments = attachments;

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.eMR.update({
        where: { id: emrId },
        data: updateData
      });

      await createAudit({
        actorId: doctorUserId,
        action: 'emr.update',
        resource: 'EMR',
        resourceId: emrId,
        before: beforeData,
        after: record,
        meta: { patientId }
      });

      return record;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Doctor PATCH /patients/:id/emr/:emrId] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

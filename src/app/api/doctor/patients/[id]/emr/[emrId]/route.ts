import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

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
  const { id } = await params;

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

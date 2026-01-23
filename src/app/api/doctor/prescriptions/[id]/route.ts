import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * GET /api/doctor/prescriptions/:id
 * Get detailed prescription information
 * 
 * RBAC: doctor.read
 * Edge cases handled:
 * - Prescription doesn't exist
 * - Prescription belongs to different doctor (blocking)
 * - Invalid prescription ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'doctor.read');
  } catch (err) {
    console.error('[Doctor GET /prescriptions/:id] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });
    }

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

    // Get prescription - ensure it belongs to this doctor
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true } },
        doctor: { select: { id: true, specialization: true, user: { select: { name: true } } } },
        pharmacist: { select: { id: true, user: { select: { name: true } } } }
      }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (prescription.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'You do not have access to this prescription' }, { status: 403 });
    }

    // Audit log
    await createAudit({
      actorId: doctorUserId,
      action: 'prescription.view',
      resource: 'Prescription',
      resourceId: id
    });

    return NextResponse.json(prescription);
  } catch (err) {
    console.error('[Doctor GET /prescriptions/:id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/doctor/prescriptions/:id
 * Update a prescription (before dispensing)
 * 
 * RBAC: prescription.update
 * Body: { medications?, instructions? }
 * Note: Cannot update if already dispensed
 * 
 * Edge cases handled:
 * - Prescription already dispensed (blocking)
 * - Prescription doesn't exist
 * - Invalid medication data
 * - Prescription belongs to different doctor
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'prescription.update');
  } catch (err) {
    console.error('[Doctor PATCH /prescriptions/:id] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (!id || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });
    }

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
    const { medications, instructions } = body;

    // Check if at least one field is provided
    if (medications === undefined && instructions === undefined) {
      return NextResponse.json({ error: 'At least one field (medications or instructions) must be provided' }, { status: 400 });
    }

    // Get existing prescription
    const existing = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (existing.doctorId !== doctor.id) {
      return NextResponse.json({ error: 'You do not have access to this prescription' }, { status: 403 });
    }

    // Cannot update if already dispensed
    if (existing.dispensed) {
      return NextResponse.json({ error: 'Cannot update a prescription that has already been dispensed' }, { status: 400 });
    }

    // Validate medications if provided
    if (medications !== undefined) {
      if (!Array.isArray(medications) || medications.length === 0) {
        return NextResponse.json({ error: 'medications must be a non-empty array' }, { status: 400 });
      }
      for (let i = 0; i < medications.length; i++) {
        const med = medications[i];
        if (!med.name || typeof med.name !== 'string') {
          return NextResponse.json({ error: `medication[${i}].name is required and must be a string` }, { status: 400 });
        }
        if (!med.dosage || typeof med.dosage !== 'string') {
          return NextResponse.json({ error: `medication[${i}].dosage is required and must be a string` }, { status: 400 });
        }
      }
    }

    // Validate instructions if provided
    if (instructions !== undefined && (typeof instructions !== 'string' || instructions.trim() === '')) {
      return NextResponse.json({ error: 'instructions must be a non-empty string' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (medications !== undefined) updateData.medications = medications;
    if (instructions !== undefined) updateData.instructions = instructions.trim();

    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.update({
        where: { id },
        data: updateData,
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { id: true } }
        }
      });

      await createAudit({
        actorId: doctorUserId,
        action: 'prescription.update',
        resource: 'Prescription',
        resourceId: id,
        before: existing,
        after: rx,
        meta: {
          changes: Object.keys(updateData),
          patientName: rx.patient?.firstName + ' ' + rx.patient?.lastName
        }
      });

      return rx;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[Doctor PATCH /prescriptions/:id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

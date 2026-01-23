import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * GET /api/doctor/patients
 * List all patients assigned to the current doctor
 * 
 * RBAC: doctor.read
 * Edge cases handled:
 * - Non-doctor users (permission denied)
 * - Doctor with no patients (empty array)
 * - Database connection errors
 */
export async function GET(req: Request) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'doctor.read');
  } catch (err) {
    console.error('[Doctor GET /patients] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const doctorId = sessionRes.session?.user?.id;
    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID not found in session' }, { status: 400 });
    }

    // Get the doctor profile to get doctorId (not userId)
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
      select: { id: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Get all patients who have appointments or prescriptions with this doctor
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { appointments: { some: { doctorId: doctor.id } } },
          { prescriptions: { some: { doctorId: doctor.id } } },
          { emrRecords: { some: {} } } // Doctor can see all EMR records
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        address: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    // Create audit log for data access
    await createAudit({
      actorId: doctorId,
      action: 'doctor.patients.list',
      resource: 'Patient',
      resourceId: 'bulk',
      meta: { count: patients.length }
    });

    return NextResponse.json(patients);
  } catch (err) {
    console.error('[Doctor GET /patients] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

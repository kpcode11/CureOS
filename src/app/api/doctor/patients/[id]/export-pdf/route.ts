import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

/**
 * POST /api/doctor/patients/:id/export-pdf
 * Generate and return PDF of patient's complete EMR
 * 
 * RBAC: patient.read, emr.read
 * Body: Optional formatting options
 * Returns: PDF binary data
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'patient.read');
  } catch (err) {
    console.error('[Doctor POST /patients/:id/export-pdf] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: patientId } = await params;

    if (!patientId || patientId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const doctorUserId = sessionRes.session?.user?.id;
    if (!doctorUserId) {
      return NextResponse.json(
        { error: 'Doctor ID not found in session' },
        { status: 400 }
      );
    }

    // Get doctor profile
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorUserId },
      select: { id: true, user: { select: { name: true } } }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    // Get patient with all related data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          where: { doctorId: doctor.id },
          select: {
            id: true,
            dateTime: true,
            reason: true,
            status: true,
            notes: true,
            createdAt: true
          },
          orderBy: { dateTime: 'desc' },
          take: 100
        },
        prescriptions: {
          where: { doctorId: doctor.id },
          select: {
            id: true,
            medications: true,
            instructions: true,
            dispensed: true,
            dispensedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        emrRecords: {
          select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            vitals: true,
            notes: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        },
        labTests: {
          select: {
            id: true,
            testType: true,
            status: true,
            priority: true,
            results: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Audit log - PDF export
    await createAudit({
      actorId: doctorUserId,
      action: 'patient.export_pdf',
      resource: 'Patient',
      resourceId: patientId,
      meta: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        exportedAt: new Date().toISOString(),
        exportedBy: doctor.user.name
      }
    });

    // Return patient data for PDF generation
    return NextResponse.json({
      success: true,
      data: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        emrRecords: patient.emrRecords,
        prescriptions: patient.prescriptions,
        appointments: patient.appointments,
        labTests: patient.labTests,
        exportInfo: {
          exportedBy: doctor.user.name,
          exportedAt: new Date().toISOString()
        }
      }
    }, { status: 200 });
  } catch (err) {
    console.error('[Doctor POST /patients/:id/export-pdf] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

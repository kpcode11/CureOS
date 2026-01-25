import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';
import { calculateHealthIndex } from '@/services/health-index.service';

/**
 * GET /api/doctor/patients/:id/health-index
 * Calculate and return health index score for a patient
 * 
 * RBAC: patient.read, emr.read
 * 
 * Response includes:
 * - overallScore: 0-100 composite health score
 * - trend: IMPROVING | STABLE | DETERIORATING | UNKNOWN
 * - category: EXCELLENT | GOOD | FAIR | POOR | CRITICAL
 * - breakdown: Individual scores for vitals, labs, medications, etc.
 * 
 * Edge cases handled:
 * - Patient doesn't exist
 * - No clinical data available
 * - Invalid patient ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'patient.read');
  } catch (err) {
    console.error('[Health Index] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: patientId } = await params;

    // Validate patient ID
    if (!patientId || patientId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      );
    }

    const userId = sessionRes.session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate health index
    const healthIndex = await calculateHealthIndex(patientId);

    // Audit log
    await createAudit({
      actorId: userId,
      action: 'health-index.read',
      resource: 'HealthIndex',
      resourceId: patientId,
      meta: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        score: healthIndex.overallScore,
        category: healthIndex.category,
      },
    });

    return NextResponse.json(healthIndex);
  } catch (err) {
    console.error('[Health Index] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// GET all insurance claims
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'insurance.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const patientId = url.searchParams.get('patientId');
    const policyId = url.searchParams.get('policyId');
    
    const where: any = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (policyId) where.policyId = policyId;

    const claims = await prisma.insuranceClaim.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
            provider: true,
            coverageAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(claims);
  } catch (err) {
    console.error('Insurance claims GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new insurance claim
export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, 'insurance.create');
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      policyId,
      patientId,
      claimAmount,
      description,
      documents,
    } = body;

    // Validation
    if (!policyId || !patientId || !claimAmount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: policyId, patientId, claimAmount, description' },
        { status: 400 }
      );
    }

    // Verify policy exists and is active
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
      include: { patient: true },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    if (policy.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Policy is not active' },
        { status: 400 }
      );
    }

    if (policy.patientId !== patientId) {
      return NextResponse.json(
        { error: 'Policy does not belong to this patient' },
        { status: 400 }
      );
    }

    // Generate unique claim number
    const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const claim = await prisma.insuranceClaim.create({
      data: {
        policyId,
        patientId,
        claimNumber,
        claimAmount: parseFloat(claimAmount),
        description,
        documents: documents || [],
        status: 'PENDING',
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        policy: {
          select: {
            policyNumber: true,
            provider: true,
          },
        },
      },
    });

    await createAudit({
      actorId,
      action: 'insurance.claim.create',
      resource: 'InsuranceClaim',
      resourceId: claim.id,
      meta: {
        claimNumber: claim.claimNumber,
        claimAmount: claim.claimAmount,
        policyNumber: claim.policy.policyNumber,
        patientName: `${claim.patient.firstName} ${claim.patient.lastName}`,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (err) {
    console.error('Insurance claim POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

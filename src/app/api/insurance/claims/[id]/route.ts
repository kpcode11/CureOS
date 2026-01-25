import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, 'insurance.update');
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, approvedAmount, notes } = body;

    const existing = await prisma.insuranceClaim.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const updated = await prisma.insuranceClaim.update({
      where: { id },
      data: {
        status: status || existing.status,
        approvedAmount: approvedAmount !== undefined ? parseFloat(approvedAmount) : existing.approvedAmount,
        notes: notes || existing.notes,
        processedAt: status && status !== 'PENDING' ? new Date() : existing.processedAt,
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
      action: 'insurance.claim.update',
      resource: 'InsuranceClaim',
      resourceId: id,
      before: existing,
      after: updated,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Insurance claim PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

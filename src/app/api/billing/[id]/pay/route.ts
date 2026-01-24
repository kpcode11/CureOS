import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'billing.update');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const actorId = (req as any).__session?.user?.id ?? null;
    const { id } = await params;
    const existing = await prisma.billing.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 409 });

    const updated = await prisma.billing.update({ where: { id: params.id }, data: { status: 'PAID', paidAt: new Date() } });

    try {
      await createAudit({ actorId, action: 'billing.pay', resource: 'Billing', resourceId: params.id, before: existing, after: updated });
    } catch (auditErr) {
      // eslint-disable-next-line no-console
      console.warn('billing.pay audit failed:', auditErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.pay error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

const ALLOWED = ['PENDING','PAID','OVERDUE','CANCELLED'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'billing.update');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { status } = await req.json();
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

    const before = await prisma.billing.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.billing.update({ where: { id: params.id }, data: { status } });

    try {
      const actorId = (req as any).__session?.user?.id ?? null;
      await createAudit({ actorId, action: 'billing.status.update', resource: 'Billing', resourceId: params.id, before, after: updated });
    } catch (auditErr) {
      // eslint-disable-next-line no-console
      console.warn('billing.status.update audit failed:', auditErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.status.update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
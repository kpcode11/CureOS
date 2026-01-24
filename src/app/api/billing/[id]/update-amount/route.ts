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
    const body = await req.json();
    const before = await prisma.billing.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (before.status === 'PAID') return NextResponse.json({ error: 'Cannot modify paid bill' }, { status: 409 });

    const data: any = {};
    if (typeof body.amount === 'number') data.amount = body.amount;
    if (typeof body.description === 'string') data.description = body.description;

    const updated = await prisma.billing.update({ where: { id: params.id }, data });

    try {
      const actorId = (req as any).__session?.user?.id ?? null;
      await createAudit({ actorId, action: 'billing.update_amount', resource: 'Billing', resourceId: params.id, before, after: updated });
    } catch (auditErr) {
      // eslint-disable-next-line no-console
      console.warn('billing.update_amount audit failed:', auditErr);
    }

    return NextResponse.json(updated);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.update_amount error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'billing.update');
    const actorId = res.session?.user?.id ?? null;

    const existing = await prisma.billing.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 409 });

    const updated = await prisma.billing.update({ where: { id: params.id }, data: { status: 'PAID', paidAt: new Date() } });
    await createAudit({ actorId, action: 'billing.pay', resource: 'Billing', resourceId: params.id, before: existing, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

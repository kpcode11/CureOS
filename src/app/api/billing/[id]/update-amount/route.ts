import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'billing.update');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();

    const before = await prisma.billing.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (before.status === 'PAID') return NextResponse.json({ error: 'Cannot modify paid bill' }, { status: 409 });

    const data: any = {};
    if (typeof body.amount === 'number') data.amount = body.amount;
    if (typeof body.description === 'string') data.description = body.description;

    const updated = await prisma.billing.update({ where: { id: params.id }, data });
    await createAudit({ actorId, action: 'billing.update_amount', resource: 'Billing', resourceId: params.id, before, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

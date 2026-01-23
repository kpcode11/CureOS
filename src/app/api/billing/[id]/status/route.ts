import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

const ALLOWED = ['PENDING','PAID','OVERDUE','CANCELLED'];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'billing.update');
    const actorId = res.session?.user?.id ?? null;
    const { status } = await req.json();
    if (!ALLOWED.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

    const before = await prisma.billing.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.billing.update({ where: { id: params.id }, data: { status } });
    await createAudit({ actorId, action: 'billing.status.update', resource: 'Billing', resourceId: params.id, before, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bedId: string }> }
) {
  const { bedId } = await params;
  try {
    const res = await requirePermission(req, 'beds.update');
    const actorId = res.session?.user?.id ?? null;
    const { status } = await req.json();
    if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].includes(status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }

    const before = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // don't allow marking AVAILABLE if there's an active assignment for this bed
    if (status === 'AVAILABLE') {
      const active = await prisma.bedAssignment.findFirst({ where: { bedId: bedId, dischargedAt: null } });
      if (active) return NextResponse.json({ error: 'bed has active assignment' }, { status: 409 });
    }

    const updated = await prisma.bed.update({ where: { id: bedId }, data: { status } });

    await createAudit({ actorId, action: 'bed.status.update', resource: 'Bed', resourceId: bedId, before, after: updated });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

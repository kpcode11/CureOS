import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'beds.update');
    const actorId = res.session?.user?.id ?? null;

    const existing = await prisma.bedAssignment.findUnique({ where: { id: params.id }, include: { bed: true } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.dischargedAt) return NextResponse.json({ error: 'Already discharged' }, { status: 409 });

    const dischargedAt = new Date();
    const [updatedAssignment, updatedBed] = await prisma.$transaction([
      prisma.bedAssignment.update({ where: { id: params.id }, data: { dischargedAt } }),
      prisma.bed.update({ where: { id: existing.bedId }, data: { status: 'AVAILABLE' } })
    ]);

    await createAudit({ actorId, action: 'bed.discharge', resource: 'BedAssignment', resourceId: params.id, before: existing, after: updatedAssignment });

    return NextResponse.json({ assignment: updatedAssignment, bed: updatedBed });
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

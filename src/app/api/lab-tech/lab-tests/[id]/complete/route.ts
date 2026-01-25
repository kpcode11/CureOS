import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/lab-tech/lab-tests/:id/complete
export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  let actorId: string | null = null;
  try {
    const res: any = await requirePermission(req, 'lab.sample.track');
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  try {
    const before = await prisma.labTest.findUnique({ where: { id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (before.status === 'COMPLETED') return NextResponse.json({ error: 'Already completed' }, { status: 409 });

    // resolve labTech entity from session user
    const labTech = actorId ? await prisma.labTech.findUnique({ where: { userId: actorId } }) : null;
    const updated = await prisma.labTest.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date(), labTechId: labTech?.id ?? undefined } });

    await createAudit({ actorId, action: 'labtest.complete', resource: 'LabTest', resourceId: id, before, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('lab-test complete PATCH error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

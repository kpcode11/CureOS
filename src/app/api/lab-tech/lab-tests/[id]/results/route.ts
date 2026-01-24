import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/lab-tech/lab-tests/:id/results
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let actorId: string | null = null;
  try {
    const res: any = await requirePermission(req, 'lab.result.enter');
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;
  const body = await req.json().catch(() => ({}));
  if (!body || typeof body.results === 'undefined') return NextResponse.json({ error: 'results required' }, { status: 400 });

  const before = await prisma.labTest.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.labTest.update({ where: { id }, data: { results: body.results } });
  await createAudit({ actorId, action: 'labtest.results.update', resource: 'LabTest', resourceId: id, before, after: updated, meta: { summary: body.summary ?? null } });
  return NextResponse.json(updated);
}
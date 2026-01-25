import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'nursing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const rec = await prisma.nursingRecord.findUnique({ where: { id } });
  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rec);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'nursing.update');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const before = await prisma.nursingRecord.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const allowed: any = {};
    if (body.vitals) allowed.vitals = body.vitals;
    if (typeof body.notes === 'string') allowed.notes = body.notes;

    const updated = await prisma.nursingRecord.update({ where: { id: params.id }, data: allowed });
    await createAudit({ actorId, action: 'nursing.record.update', resource: 'NursingRecord', resourceId: params.id, before, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

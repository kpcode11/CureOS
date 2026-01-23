import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'nursing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const patientName = url.searchParams.get('patientName');
  const where: Prisma.NursingRecordWhereInput = patientName
    ? { patientName: { contains: patientName, mode: Prisma.QueryMode.insensitive } }
    : {};

  const rows = await prisma.nursingRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'nursing.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    if (!body.vitals || !body.nurseId) return NextResponse.json({ error: 'nurseId and vitals required' }, { status: 400 });

    const rec = await prisma.nursingRecord.create({ data: { nurseId: body.nurseId, patientName: body.patientName ?? '', vitals: body.vitals ?? {}, notes: body.notes ?? null } });

    await createAudit({ actorId, action: 'nursing.record.create', resource: 'NursingRecord', resourceId: rec.id, after: rec });

    return NextResponse.json(rec, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

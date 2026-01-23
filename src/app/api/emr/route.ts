import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'emr.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.eMR.findMany({ take: 200, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'emr.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.eMR.create({ data: { patientId: body.patientId, diagnosis: body.diagnosis ?? '', symptoms: body.symptoms ?? '', vitals: body.vitals ?? {} } });
    await createAudit({ actorId, action: 'emr.create', resource: 'EMR', resourceId: rec.id, meta: { patientId: rec.patientId } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'emergency.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.emergency.findMany({ take: 200, orderBy: { arrivedAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'emergency.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.emergency.create({ data: { patientName: body.patientName ?? 'Unknown', condition: body.condition ?? '', severity: body.severity ?? 'MODERATE' } });
    await createAudit({ actorId, action: 'emergency.create', resource: 'Emergency', resourceId: rec.id, meta: { condition: rec.condition } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
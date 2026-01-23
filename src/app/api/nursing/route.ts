import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'nursing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.nursingRecord.findMany({ take: 200, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'nursing.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.nursingRecord.create({ data: { nurseId: body.nurseId, patientName: body.patientName ?? '', vitals: body.vitals ?? {} } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
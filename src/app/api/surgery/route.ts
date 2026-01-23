import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'surgery.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.surgery.findMany({ take: 200, orderBy: { scheduledAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'surgery.create');
    const body = await req.json();
    const rec = await prisma.surgery.create({ data: { doctorId: body.doctorId, patientName: body.patientName, surgeryType: body.surgeryType, scheduledAt: new Date(body.scheduledAt) } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
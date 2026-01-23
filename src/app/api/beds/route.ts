import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'beds.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.bed.findMany({ take: 200, orderBy: { bedNumber: 'asc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'beds.update');
    const body = await req.json();
    const rec = await prisma.bed.create({ data: { bedNumber: body.bedNumber, ward: body.ward ?? 'General', bedType: body.bedType ?? 'standard' } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
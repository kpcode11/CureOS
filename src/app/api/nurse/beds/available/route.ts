import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'beds.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.bed.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { bedNumber: 'asc' },
    select: { id: true, bedNumber: true, ward: true, bedType: true, status: true }
  });

  return NextResponse.json(rows);
}

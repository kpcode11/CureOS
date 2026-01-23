import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const rows = await prisma.billing.findMany({ where: { status: 'PENDING', dueDate: { lt: now } }, orderBy: { dueDate: 'asc' } });
  return NextResponse.json(rows);
}

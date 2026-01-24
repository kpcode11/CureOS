import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rec = await prisma.billing.findUnique({ where: { id: params.id }, include: { patient: true } });
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rec);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.[id].GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
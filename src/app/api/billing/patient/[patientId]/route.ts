import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.billing.findMany({ where: { patientId: params.patientId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.patient.GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
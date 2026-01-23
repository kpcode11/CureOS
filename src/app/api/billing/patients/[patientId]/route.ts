import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const patient = await prisma.patient.findUnique({ where: { id: params.patientId }, select: { id: true, firstName: true, lastName: true, phone: true } });
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const bills = await prisma.billing.findMany({ where: { patientId: params.patientId } });
  const summary = bills.reduce((acc, b) => {
    acc.total += Number(b.amount);
    if (b.status === 'PENDING') acc.due += Number(b.amount);
    if (b.status === 'PAID') acc.paid += Number(b.amount);
    return acc;
  }, { total: 0, due: 0, paid: 0 });

  return NextResponse.json({ patient, summary, bills });
}

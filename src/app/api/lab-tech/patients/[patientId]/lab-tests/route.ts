import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/lab-tech/patients/:patientId/lab-tests
export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'lab.order.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.labTest.findMany({ where: { patientId: params.patientId }, orderBy: { orderedAt: 'desc' } });
    return NextResponse.json(rows);
  } catch (err) {
    console.error('lab-tech patient lab-tests GET error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

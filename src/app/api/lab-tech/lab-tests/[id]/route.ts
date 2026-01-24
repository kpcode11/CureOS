import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/lab-tech/lab-tests/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'lab.order.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;
  try {
    const rec = await prisma.labTest.findUnique({
      where: { id },
      include: { patient: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true, gender: true, phone: true } } }
    });
    if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rec);
  } catch (err) {
    console.error('lab-test detail GET error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

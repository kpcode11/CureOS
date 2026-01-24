import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/lab-tech/patients/:patientId
export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'patient.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const p = await prisma.patient.findUnique({ where: { id: params.patientId }, select: { id: true, firstName: true, lastName: true, dateOfBirth: true, gender: true, phone: true, bloodType: true } });
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (err) {
    console.error('lab-tech patient GET error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

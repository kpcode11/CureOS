import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacist/patients/:patientId/emr
export async function GET(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  try {
    await requirePermission(req, 'emr.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { patientId } = await params;
  const records = await prisma.eMR.findMany({
    where: { patientId },
    select: { id: true, diagnosis: true, symptoms: true, vitals: true, notes: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (!records || records.length === 0) return NextResponse.json({ error: 'No EMR found' }, { status: 404 });
  return NextResponse.json(records);
}
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'emr.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { patientId } = await params;
  const rows = await prisma.eMR.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

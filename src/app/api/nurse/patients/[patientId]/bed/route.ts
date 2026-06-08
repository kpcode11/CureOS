import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params;
  try {
    await requirePermission(req, 'beds.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const assignment = await prisma.bedAssignment.findFirst({ where: { patientId: patientId, dischargedAt: null }, include: { bed: true, nurse: { select: { id: true, department: true } } } });
  if (!assignment) return NextResponse.json({ error: 'No active bed assignment' }, { status: 404 });
  return NextResponse.json(assignment);
}

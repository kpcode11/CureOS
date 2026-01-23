import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacist/prescriptions?dispensed=false
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'pharmacy.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const dispensedQ = url.searchParams.get('dispensed');
  const where: any = {};
  if (dispensedQ === 'false') where.dispensed = false;
  if (dispensedQ === 'true') where.dispensed = true;

  const list = await prisma.prescription.findMany({
    where,
    take: 200,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      patientId: true,
      doctorId: true,
      pharmacistId: true,
      dispensed: true,
      dispensedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(list);
}
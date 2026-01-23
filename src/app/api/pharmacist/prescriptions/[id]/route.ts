import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacist/prescriptions/:id
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'pharmacy.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;
  const rec = await prisma.prescription.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, user: { select: { id: true, name: true, email: true } }, specialization: true } },
      patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, dateOfBirth: true } },
    },
  });

  if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // return medications JSON as-is so pharmacist can review legacy -> new formats
  return NextResponse.json({
    id: rec.id,
    patient: rec.patient,
    doctor: rec.doctor,
    medications: rec.medications,
    instructions: rec.instructions,
    dispensed: rec.dispensed,
    dispensedAt: rec.dispensedAt,
  });
}
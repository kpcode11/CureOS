import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/pharmacist/prescriptions/:id/undo-dispense
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'pharmacy.dispense');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;
  const existing = await prisma.prescription.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!existing.dispensed) return NextResponse.json({ error: 'Not dispensed' }, { status: 400 });

  const actorId = (await requirePermission(req, 'pharmacy.dispense')).session?.user?.id ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    const before = existing;
    const p = await tx.prescription.update({ where: { id }, data: { dispensed: false, dispensedAt: null, pharmacistId: null } });
    await createAudit({ actorId, action: 'prescription.undo-dispense', resource: 'Prescription', resourceId: id, before, after: p });
    return p;
  });

  return NextResponse.json(updated);
}
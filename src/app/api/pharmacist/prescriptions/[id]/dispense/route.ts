import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/pharmacist/prescriptions/:id/dispense
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  let sessionRes;
  try {
    sessionRes = await requirePermission(req, 'pharmacy.dispense');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const actorId = sessionRes.session?.user?.id ?? null;

  const existing = await prisma.prescription.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.dispensed) return NextResponse.json({ error: 'Already dispensed' }, { status: 400 });

  // perform dispense in a transaction (mark prescription, optionally deduct inventory handled separately)
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.prescription.update({ where: { id }, data: { dispensed: true, dispensedAt: now, pharmacistId: actorId } });
    await createAudit({ actorId, action: 'prescription.dispense', resource: 'Prescription', resourceId: id, before: existing, after: p });
    return p;
  });

  return NextResponse.json(updated);
}
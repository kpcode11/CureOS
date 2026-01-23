import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'prescriptions.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const list = await prisma.prescription.findMany({ take: 200, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'prescriptions.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.prescription.create({ data: { patientId: body.patientId, doctorId: body.doctorId, medications: body.medications ?? {}, instructions: body.instructions ?? '' } });
    await createAudit({ actorId, action: 'prescription.create', resource: 'Prescription', resourceId: rec.id, meta: { patientId: rec.patientId } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
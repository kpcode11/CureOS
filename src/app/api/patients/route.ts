import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'patients.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const patients = await prisma.patient.findMany({ take: 200 });
  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, 'patients.create');
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const rec = await prisma.patient.create({ data: {
    firstName: body.firstName ?? 'Unknown',
    lastName: body.lastName ?? 'Unknown',
    email: body.email ?? null,
    phone: body.phone ?? '',
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : new Date('1970-01-01'),
    gender: body.gender ?? 'other',
    address: body.address ?? null,
  } });
  await createAudit({ actorId, action: 'patient.create', resource: 'Patient', resourceId: rec.id, meta: { firstName: rec.firstName, lastName: rec.lastName } });
  return NextResponse.json(rec);
}
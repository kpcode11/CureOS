import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'insurance.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // NOTE: Prisma client types may be stale in some developer environments.
  // If you see a TS error about `insurance` not existing on `prisma`, run `npx prisma generate`.
  const p: any = prisma;
  const rows = await p.insurance.findMany({ take: 200 });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    await requirePermission(req, 'insurance.create');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const p: any = prisma;
  const rec = await p.insurance.create({ data: { provider: body.provider ?? 'Unknown', policyNumber: body.policyNumber ?? '', patientId: body.patientId ?? null } });
  return NextResponse.json(rec);
}
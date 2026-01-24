import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';



export async function GET(req: Request) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.billing.findMany({ take: 200, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'billing.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.billing.create({ data: { patientId: body.patientId, amount: body.amount, description: body.description ?? '', dueDate: body.dueDate ? new Date(body.dueDate) : new Date() } });
    await createAudit({ actorId, action: 'billing.create', resource: 'Billing', resourceId: rec.id, meta: { amount: rec.amount, patientId: rec.patientId } });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
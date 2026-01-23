import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/pharmacist/inventory/:id/deduct
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const res = await requirePermission(req, 'inventory.update');
    const actorId = res.session?.user?.id ?? null;
    const { id } = await params;
    const body = await req.json();
    const qty = Number(body.quantity ?? 0);
    if (!qty || qty <= 0) return NextResponse.json({ error: 'quantity must be > 0' }, { status: 400 });

    const existing = await prisma.inventory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if ((existing.quantity ?? 0) < qty) return NextResponse.json({ error: 'insufficient stock' }, { status: 400 });

    const updated = await prisma.$transaction(async (tx) => {
      const before = existing;
      const u = await tx.inventory.update({ where: { id }, data: { quantity: { decrement: qty } as any } });
      await createAudit({ actorId, action: 'inventory.deduct', resource: 'Inventory', resourceId: id, before, after: u, meta: { deducted: qty } });
      return u;
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
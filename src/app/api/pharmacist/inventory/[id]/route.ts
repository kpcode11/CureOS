import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/pharmacist/inventory/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const res = await requirePermission(req, 'inventory.update');
    const actorId = res.session?.user?.id ?? null;
    const id = params.id;
    const body = await req.json();

    const existing = await prisma.inventory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data: any = {};
    if (body.itemName !== undefined) data.itemName = body.itemName;
    if (body.category !== undefined) data.category = body.category;
    if (body.quantity !== undefined) data.quantity = Number(body.quantity);
    if (body.minStock !== undefined) data.minStock = Number(body.minStock);
    if (body.unit !== undefined) data.unit = body.unit;
    if (body.batchNumber !== undefined) data.batchNumber = body.batchNumber;
    if (body.expiryDate !== undefined) data.expiryDate = body.expiryDate;

    const updated = await prisma.inventory.update({ where: { id }, data });
    await createAudit({ actorId, action: 'inventory.update', resource: 'Inventory', resourceId: id, before: existing, after: updated });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
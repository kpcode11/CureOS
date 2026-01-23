import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// GET /api/pharmacist/inventory
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'inventory.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.inventory.findMany({ take: 500, orderBy: { itemName: 'asc' } });
  return NextResponse.json(rows);
}

// POST /api/pharmacist/inventory
export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'inventory.update');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    if (!body?.itemName) return NextResponse.json({ error: 'itemName is required' }, { status: 400 });

    const rec = await prisma.inventory.create({ data: { itemName: body.itemName, category: body.category ?? 'general', quantity: Number(body.quantity ?? 0), minStock: Number(body.minStock ?? 0), unit: body.unit ?? 'ea', batchNumber: body.batchNumber ?? null, expiryDate: body.expiryDate ?? null } });
    await createAudit({ actorId, action: 'inventory.create', resource: 'Inventory', resourceId: rec.id, after: rec });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacist/inventory/low-stock
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'inventory.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.inventory.findMany({ where: { quantity: { lte: prisma.raw('"minStock"') } }, orderBy: { itemName: 'asc' }, take: 200 });
  // Fallback - if the DB/Prisma version doesn't allow raw in where, do client-side filter
  if (!rows.length) {
    const all = await prisma.inventory.findMany({ take: 200, orderBy: { itemName: 'asc' } });
    return NextResponse.json(all.filter((r) => r.quantity <= (r.minStock ?? 0)));
  }
  return NextResponse.json(rows);
}
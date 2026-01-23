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

  // Fetch all inventory and filter client-side since raw comparisons with column to column can be complex
  const all = await prisma.inventory.findMany({ orderBy: { itemName: 'asc' }, take: 200 });
  const lowStock = all.filter((r) => (r.quantity ?? 0) <= (r.minStock ?? 0));
  
  return NextResponse.json(lowStock);
}
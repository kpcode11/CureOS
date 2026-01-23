import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'inventory.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.inventory.findMany({ take: 200, orderBy: { itemName: 'asc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'inventory.update');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const rec = await prisma.inventory.create({ 
      data: { 
        itemName: body.itemName,
        category: body.category ?? 'general',
        quantity: body.quantity ?? 0,
        minStock: body.minStock ?? 10,
        unit: body.unit ?? 'ea'
      } 
    });
    return NextResponse.json(rec);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
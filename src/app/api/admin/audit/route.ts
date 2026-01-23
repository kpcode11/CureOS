import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';

export async function GET(req: Request) {
  try {
    await requirePermission(undefined, 'audit.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get('take') || 50), 200);
  const skip = Math.max(Number(url.searchParams.get('skip') || 0), 0);

  const [items, count] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({ items, count });
}

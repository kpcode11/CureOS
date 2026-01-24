import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'audit.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const resourceId = url.searchParams.get('resourceId');
  const where: any = { resource: 'Billing' };
  if (resourceId) where.resourceId = resourceId;

  const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json(rows);
}
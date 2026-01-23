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
  const resource = url.searchParams.get('resource');
  const actorId = url.searchParams.get('actorId');

  const where: any = {};
  if (resource) where.resource = resource;
  if (actorId) where.actorId = actorId;

  // limit and ordering consistent with other audit endpoints
  const rows = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json(rows);
}

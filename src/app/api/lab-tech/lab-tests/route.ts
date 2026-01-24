import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/lab-tech/lab-tests?status=PENDING|IN_PROGRESS
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'lab.order.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  const where: any = {};
  if (status) {
    // allow callers to request a specific status
    where.status = status;
  } else {
    // default: show work-queue statuses
    where.status = { in: ['PENDING', 'IN_PROGRESS'] };
  }

  const rows = await prisma.labTest.findMany({ where, orderBy: { orderedAt: 'desc' }, take: 200 });
  return NextResponse.json(rows);
}

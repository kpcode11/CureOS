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
  const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  if (status) {
    // accept comma-separated list or single value; validate against enum
    const requested = status.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    const invalid = requested.find((s) => !allowedStatuses.includes(s));
    if (invalid) return NextResponse.json({ error: `invalid status: ${invalid}` }, { status: 400 });
    where.status = requested.length === 1 ? requested[0] : { in: requested };
  } else {
    // default: show work-queue statuses
    where.status = { in: ['PENDING', 'IN_PROGRESS'] };
  }

  try {
    const rows = await prisma.labTest.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
      take: 200,
    });
    return NextResponse.json(rows);
  } catch (err) {
    console.error('lab-tests GET error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

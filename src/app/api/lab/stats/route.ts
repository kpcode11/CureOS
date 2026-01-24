import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentLabTech } from '@/lib/lab';

export async function GET(_req: NextRequest) {
  try {
    const { labTech } = await getCurrentLabTech();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, inProgress, completedToday, myAssigned] = await Promise.all([
      prisma.labTest.count({ where: { status: 'PENDING' } }),
      prisma.labTest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.labTest.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
      prisma.labTest.count({
        where: {
          labTechId: labTech.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return NextResponse.json({
      stats: { pending, inProgress, completedToday, myAssigned },
    });
  } catch (err: any) {
    if (err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN' || err.message === 'LAB_TECH_NOT_FOUND') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch lab stats' }, { status: 500 });
  }
}

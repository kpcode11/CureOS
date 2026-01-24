import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LAB_TECH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING';
    const assigned = searchParams.get('assigned') ?? 'all';

    const where: any = { status };

    // ✅ If assigned to me, find my LabTech record first
    if (assigned === 'me') {
      const labTech = await prisma.labTech.findUnique({
        where: { userId: session.user.id },
      });

      if (labTech) {
        where.labTechId = labTech.id;
      }
    }

    const tests = await prisma.labTest.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        labTech: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ tests });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch lab tests' }, { status: 500 });
  }
}

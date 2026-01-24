import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: { patientId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'LAB_TECH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tests = await prisma.labTest.findMany({
      where: { patientId: params.patientId },
      include: {
        labTech: { select: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patient lab tests' },
      { status: 500 }
    );
  }
}

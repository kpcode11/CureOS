import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'LAB_TECH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const test = await prisma.labTest.update({
      where: { id: params.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: { patient: true },
    });

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start test' }, { status: 500 });
  }
}

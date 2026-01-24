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
    const { results } = await req.json();

    const test = await prisma.labTest.update({
      where: { id: params.id },
      data: {
        results,
        status: 'COMPLETED',
        completedAt: new Date(),
        labTechId: session.user.id,
      },
      include: { patient: true },
    });

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update results' }, { status: 500 });
  }
}

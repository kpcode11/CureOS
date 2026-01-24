import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'LAB_TECH') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          startsWith: 'LAB_',
        },
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

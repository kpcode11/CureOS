import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type LabAction = 'START' | 'COMPLETE' | 'UPDATE_RESULTS';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LAB_TECH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const test = await prisma.labTest.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        labTech: { include: { user: { select: { name: true } } } },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 });
    }

    return NextResponse.json({ test });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch lab test' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'LAB_TECH') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const action: LabAction = body.action;

    const existing = await prisma.labTest.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Lab test not found' }, { status: 404 });
    }

    const now = new Date();
    const data: any = { updatedAt: now };

    switch (action) {
      case 'START':
        data.status = 'IN_PROGRESS';
        data.startedAt = now;
        data.labTechId = session.user.id;
        break;

      case 'UPDATE_RESULTS':
        data.results = body.results;
        break;

      case 'COMPLETE':
        data.status = 'COMPLETED';
        data.completedAt = now;
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await prisma.labTest.update({
      where: { id: params.id },
      data,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: `LAB_${action}`,
        resource: 'LabTest',
        resourceId: params.id,
        meta: { before: existing, after: updated },
      },
    });

    return NextResponse.json({ test: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update lab test' }, { status: 500 });
  }
}

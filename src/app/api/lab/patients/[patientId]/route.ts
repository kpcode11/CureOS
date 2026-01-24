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
    const patient = await prisma.patient.findUnique({
      where: { id: params.patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        bloodType: true,
        address: true,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    );
  }
}

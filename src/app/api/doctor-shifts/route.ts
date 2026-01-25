import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  upsertDoctorShift,
  getDoctorShifts,
  updateDoctorSeniority,
} from '@/services/scheduling.service';
import { ShiftType, SeniorityLevel, SHIFT_TIMES } from '@/types/scheduling';

/**
 * GET /api/doctor-shifts
 * Get shift schedules for doctors
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (doctorId) {
      // Get shifts for specific doctor
      const shifts = await getDoctorShifts(doctorId);
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          seniority: true,
          specialization: true,
          user: {
            select: { name: true, email: true },
          },
        },
      });

      return NextResponse.json({ doctor, shifts });
    }

    // Get all doctors with their shifts
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        shifts: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });

    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Get doctor shifts error:', error);
    return NextResponse.json(
      { error: 'Failed to get doctor shifts' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/doctor-shifts
 * Create or update a doctor's shift schedule
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage shifts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can manage doctor shifts' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { doctorId, shiftType, dayOfWeek, startTime, endTime } = body;

    if (!doctorId || !shiftType || dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: doctorId, shiftType, dayOfWeek' },
        { status: 400 },
      );
    }

    // Validate shift type
    if (!['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'].includes(shiftType)) {
      return NextResponse.json(
        { error: 'Invalid shiftType' },
        { status: 400 },
      );
    }

    // Use default times if not provided
    const defaultTimes = SHIFT_TIMES[shiftType as ShiftType];
    const shift = await upsertDoctorShift(
      doctorId,
      shiftType as ShiftType,
      dayOfWeek,
      startTime || defaultTimes.start,
      endTime || defaultTimes.end,
    );

    return NextResponse.json({ success: true, shift });
  } catch (error) {
    console.error('Create doctor shift error:', error);
    return NextResponse.json(
      { error: 'Failed to create doctor shift' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/doctor-shifts
 * Update doctor's seniority level
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update seniority
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update doctor seniority' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { doctorId, seniority } = body;

    if (!doctorId || !seniority) {
      return NextResponse.json(
        { error: 'Missing required fields: doctorId, seniority' },
        { status: 400 },
      );
    }

    // Validate seniority
    if (!['HOD', 'SENIOR', 'JUNIOR'].includes(seniority)) {
      return NextResponse.json(
        { error: 'Invalid seniority. Must be HOD, SENIOR, or JUNIOR' },
        { status: 400 },
      );
    }

    const doctor = await updateDoctorSeniority(
      doctorId,
      seniority as SeniorityLevel,
    );

    return NextResponse.json({ success: true, doctor });
  } catch (error) {
    console.error('Update doctor seniority error:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor seniority' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/doctor-shifts
 * Deactivate a doctor's shift
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete shifts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete doctor shifts' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');

    if (!shiftId) {
      return NextResponse.json(
        { error: 'Missing shiftId parameter' },
        { status: 400 },
      );
    }

    await prisma.doctorShift.update({
      where: { id: shiftId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete doctor shift error:', error);
    return NextResponse.json(
      { error: 'Failed to delete doctor shift' },
      { status: 500 },
    );
  }
}

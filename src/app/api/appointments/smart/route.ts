import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { findBestAvailableDoctor } from '@/services/scheduling.service';
import {
  SeverityLevel,
  ProblemCategory,
} from '@/types/scheduling';

/**
 * POST /api/appointments/smart
 * Create an appointment with automatic doctor assignment based on severity and problem category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      severity,
      problemCategory,
      symptoms,
      preferredDate,
      preferredTime,
      reason,
      notes,
    } = body;

    // Validate required fields
    if (!patientId || !severity || !problemCategory || !preferredDate) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, severity, problemCategory, preferredDate' },
        { status: 400 },
      );
    }

    // Validate severity
    if (!['LOW', 'MODERATE', 'HIGH'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity. Must be LOW, MODERATE, or HIGH' },
        { status: 400 },
      );
    }

    // Build requested datetime
    const dateTime = new Date(`${preferredDate}T${preferredTime || '09:00'}:00`);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time format' },
        { status: 400 },
      );
    }

    // Find best available doctor
    const recommendation = await findBestAvailableDoctor(
      problemCategory as ProblemCategory,
      severity as SeverityLevel,
      dateTime,
    );

    if (!recommendation.success || !recommendation.doctor) {
      return NextResponse.json(
        {
          error: 'No suitable doctor available',
          details: recommendation.reason,
          alternatives: recommendation.alternativeDoctors,
        },
        { status: 404 },
      );
    }

    // Get receptionist ID if user is a receptionist
    let receptionistId: string | null = null;
    if (session.user.role === 'RECEPTIONIST') {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: session.user.id },
      });
      receptionistId = receptionist?.id || null;
    }

    // Create the appointment with smart scheduling data
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: recommendation.doctor.id,
        receptionistId,
        dateTime,
        reason: reason || `${problemCategory.replace('_', ' ')} - ${severity} severity`,
        notes,
        severity: severity as SeverityLevel,
        problemCategory: problemCategory as ProblemCategory,
        symptoms: symptoms || [],
        wasAutoAssigned: true,
        status: 'SCHEDULED',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      appointment,
      assignmentDetails: {
        doctor: recommendation.doctor,
        reason: recommendation.reason,
        alternatives: recommendation.alternativeDoctors,
      },
    });
  } catch (error) {
    console.error('Smart appointment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/appointments/smart
 * Get doctor recommendations without creating an appointment
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity') as SeverityLevel;
    const problemCategory = searchParams.get('problemCategory') as ProblemCategory;
    const date = searchParams.get('date');
    const time = searchParams.get('time') || '09:00';

    if (!severity || !problemCategory || !date) {
      return NextResponse.json(
        { error: 'Missing required params: severity, problemCategory, date' },
        { status: 400 },
      );
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date/time format' },
        { status: 400 },
      );
    }

    const recommendation = await findBestAvailableDoctor(
      problemCategory,
      severity,
      dateTime,
    );

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Doctor recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 },
    );
  }
}

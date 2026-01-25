/**
 * Smart Appointment Booking API
 * 
 * This endpoint provides intelligent doctor assignment based on:
 * - Patient's problem category (maps to doctor specialization)
 * - Severity level (determines required doctor seniority)
 * - Appointment time (matches doctor shift availability)
 * 
 * Endpoints:
 * - POST /api/appointments/smart: Create appointment with auto-assigned doctor
 * - GET /api/appointments/smart/recommend: Get doctor recommendations without booking
 */

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';
import {
  findBestAvailableDoctor,
  isDoctorAvailableAtTime,
  initializeDoctorConfigs,
  getDoctorConfig,
} from '@/services/scheduling.service';
import {
  SeverityLevel,
  ProblemCategory,
  AppointmentMetadata,
  stringifyAppointmentMetadata,
  SEVERITY_LEVELS,
  PROBLEM_TYPES,
  SmartAppointmentRequest,
} from '@/types/scheduling';

// Initialize doctor configs on first request
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await initializeDoctorConfigs();
    initialized = true;
  }
}

/**
 * POST /api/appointments/smart
 * Create an appointment with intelligent doctor assignment
 * 
 * Body (SmartAppointmentRequest):
 * - patientId: string (required)
 * - dateTime: ISO string (required)
 * - severity: 'LOW' | 'MODERATE' | 'HIGH' (required)
 * - problemCategory: ProblemCategory (required)
 * - problemDescription: string (optional)
 * - symptoms: string[] (optional)
 * - notes: string (optional)
 * - preferredDoctorId: string (optional - skip auto-assignment if provided)
 * - autoAssign: boolean (default true - automatically assign best doctor)
 */
export async function POST(req: Request) {
  let actorId: string | null = null;
  let receptionistId: string | null = null;

  try {
    const res = await requirePermission(req, 'appointment.create');
    actorId = res.session?.user?.id ?? null;

    // Get receptionist ID if user is a receptionist
    if (actorId) {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: actorId },
      });
      receptionistId = receptionist?.id ?? null;
    }
  } catch (err) {
    console.error('[Smart Appointment] Permission denied:', err);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureInitialized();

  const body = await req.json() as SmartAppointmentRequest;

  // Validate required fields
  if (!body.patientId || !body.dateTime) {
    return NextResponse.json(
      { error: 'Missing required fields: patientId, dateTime' },
      { status: 400 }
    );
  }

  // Validate severity
  if (!body.severity || !SEVERITY_LEVELS[body.severity]) {
    return NextResponse.json(
      { error: 'severity is required and must be LOW, MODERATE, or HIGH' },
      { status: 400 }
    );
  }

  // Validate problem category
  if (!body.problemCategory || !PROBLEM_TYPES[body.problemCategory]) {
    return NextResponse.json(
      { error: `problemCategory is required. Valid values: ${Object.keys(PROBLEM_TYPES).join(', ')}` },
      { status: 400 }
    );
  }

  const appointmentDateTime = new Date(body.dateTime);
  if (isNaN(appointmentDateTime.getTime())) {
    return NextResponse.json(
      { error: 'Invalid dateTime format' },
      { status: 400 }
    );
  }

  // Check if date is in the past
  if (appointmentDateTime < new Date()) {
    return NextResponse.json(
      { error: 'Cannot book appointment in the past' },
      { status: 400 }
    );
  }

  try {
    let doctorId: string;
    let autoAssigned = false;
    let assignmentReason: string;
    let alternativeDoctors: Array<{ id: string; name: string; specialization: string }> = [];

    // If preferred doctor is specified and autoAssign is not explicitly true, use preferred
    if (body.preferredDoctorId && body.autoAssign !== true) {
      // Check if preferred doctor is available
      const availability = await isDoctorAvailableAtTime(body.preferredDoctorId, appointmentDateTime);
      
      if (!availability.available) {
        return NextResponse.json({
          error: 'Preferred doctor is not available at this time',
          conflictingAppointment: availability.conflictingAppointment,
          suggestion: 'Set autoAssign: true to automatically find an available doctor',
        }, { status: 409 });
      }

      doctorId = body.preferredDoctorId;
      const config = getDoctorConfig(doctorId);
      assignmentReason = `Manually selected doctor (${config?.seniority || 'unknown'} seniority)`;
    } else {
      // Auto-assign the best available doctor
      const assignment = await findBestAvailableDoctor(
        body.problemCategory,
        body.severity,
        appointmentDateTime
      );

      if (!assignment.success || !assignment.doctor) {
        return NextResponse.json({
          success: false,
          error: 'No suitable doctor available',
          reason: assignment.reason,
          alternativeDoctors: assignment.alternativeDoctors,
          suggestion: 'Try a different time slot or select a specific doctor manually',
        }, { status: 404 });
      }

      // Check if auto-assigned doctor is available (not double-booked)
      const availability = await isDoctorAvailableAtTime(assignment.doctor.id, appointmentDateTime);
      
      if (!availability.available) {
        // Try to find next best doctor
        const retryAssignment = await findBestAvailableDoctor(
          body.problemCategory,
          body.severity,
          appointmentDateTime,
          [assignment.doctor.id] // Exclude the unavailable doctor
        );

        if (!retryAssignment.success || !retryAssignment.doctor) {
          return NextResponse.json({
            success: false,
            error: 'All suitable doctors are booked at this time',
            reason: retryAssignment.reason,
            alternativeDoctors: retryAssignment.alternativeDoctors,
            suggestion: 'Please select a different time slot',
          }, { status: 409 });
        }

        doctorId = retryAssignment.doctor.id;
        assignmentReason = retryAssignment.reason;
        alternativeDoctors = retryAssignment.alternativeDoctors?.map(d => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
        })) || [];
      } else {
        doctorId = assignment.doctor.id;
        assignmentReason = assignment.reason;
        alternativeDoctors = assignment.alternativeDoctors?.map(d => ({
          id: d.id,
          name: d.name,
          specialization: d.specialization,
        })) || [];
      }

      autoAssigned = true;
    }

    // Build the reason string
    const problemType = PROBLEM_TYPES[body.problemCategory];
    const reason = body.problemDescription 
      ? `${problemType.label}: ${body.problemDescription}`
      : `${problemType.label} consultation`;

    // Build metadata for notes field
    const metadata: AppointmentMetadata = {
      severity: body.severity,
      problemCategory: body.problemCategory,
      problemDescription: body.problemDescription,
      symptoms: body.symptoms,
      autoAssigned,
      assignmentReason,
      originalNotes: body.notes,
    };

    const notesData = stringifyAppointmentMetadata(metadata);

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId,
        receptionistId,
        dateTime: appointmentDateTime,
        reason,
        notes: notesData,
        status: 'SCHEDULED',
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        receptionist: {
          include: {
            user: true,
          },
        },
      },
    });

    // Audit log
    await createAudit({
      actorId,
      action: 'appointment.smart_create',
      resource: 'Appointment',
      resourceId: appointment.id,
      meta: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        dateTime: appointment.dateTime,
        severity: body.severity,
        problemCategory: body.problemCategory,
        autoAssigned,
        assignmentReason,
      },
    });

    console.log('[Smart Appointment] Successfully created:', {
      id: appointment.id,
      doctor: appointment.doctor.user.name,
      severity: body.severity,
      autoAssigned,
    });

    // Get doctor config for response
    const doctorConfig = getDoctorConfig(doctorId);

    return NextResponse.json({
      success: true,
      appointment: {
        ...appointment,
        metadata, // Include parsed metadata in response
      },
      assignment: {
        autoAssigned,
        reason: assignmentReason,
        doctorSeniority: doctorConfig?.seniority || 'UNKNOWN',
        alternativeDoctors,
      },
    });

  } catch (error) {
    console.error('[Smart Appointment] Creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments/smart
 * Get doctor recommendations for a potential appointment
 * 
 * Query params:
 * - severity: LOW | MODERATE | HIGH
 * - problemCategory: ProblemCategory
 * - dateTime: ISO string
 */
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'appointment.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureInitialized();

  const url = new URL(req.url);
  const severity = url.searchParams.get('severity') as SeverityLevel | null;
  const problemCategory = url.searchParams.get('problemCategory') as ProblemCategory | null;
  const dateTimeStr = url.searchParams.get('dateTime');

  if (!severity || !problemCategory || !dateTimeStr) {
    return NextResponse.json(
      { error: 'Missing required params: severity, problemCategory, dateTime' },
      { status: 400 }
    );
  }

  if (!SEVERITY_LEVELS[severity]) {
    return NextResponse.json(
      { error: 'Invalid severity. Must be LOW, MODERATE, or HIGH' },
      { status: 400 }
    );
  }

  if (!PROBLEM_TYPES[problemCategory]) {
    return NextResponse.json(
      { error: `Invalid problemCategory. Valid values: ${Object.keys(PROBLEM_TYPES).join(', ')}` },
      { status: 400 }
    );
  }

  const appointmentDateTime = new Date(dateTimeStr);
  if (isNaN(appointmentDateTime.getTime())) {
    return NextResponse.json(
      { error: 'Invalid dateTime format' },
      { status: 400 }
    );
  }

  try {
    const recommendation = await findBestAvailableDoctor(
      problemCategory,
      severity,
      appointmentDateTime
    );

    // Also check availability
    if (recommendation.success && recommendation.doctor) {
      const availability = await isDoctorAvailableAtTime(
        recommendation.doctor.id,
        appointmentDateTime
      );
      
      return NextResponse.json({
        ...recommendation,
        isAvailable: availability.available,
        conflictingAppointment: availability.conflictingAppointment,
        problemType: PROBLEM_TYPES[problemCategory],
        severityInfo: SEVERITY_LEVELS[severity],
      });
    }

    return NextResponse.json({
      ...recommendation,
      problemType: PROBLEM_TYPES[problemCategory],
      severityInfo: SEVERITY_LEVELS[severity],
    });

  } catch (error) {
    console.error('[Smart Appointment] Recommendation failed:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: String(error) },
      { status: 500 }
    );
  }
}

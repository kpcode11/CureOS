import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";
import {
  SeverityLevel,
  ProblemCategory,
  AppointmentMetadata,
  stringifyAppointmentMetadata,
  parseAppointmentMetadata,
  SEVERITY_LEVELS,
  PROBLEM_TYPES,
} from "@/types/scheduling";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "appointment.read");
  } catch (err) {
    console.error('[Appointment GET] Permission denied:', err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
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
    orderBy: {
      dateTime: "desc",
    },
    take: 200,
  });

  // Enrich appointments with parsed metadata
  const enrichedAppointments = appointments.map(apt => {
    const metadata = parseAppointmentMetadata(apt.notes);
    return {
      ...apt,
      metadata, // Parsed severity, problemCategory, etc.
      displayNotes: metadata?.originalNotes || apt.notes, // Show original notes to users
    };
  });

  return NextResponse.json(enrichedAppointments);
}

export async function POST(req: Request) {
  let actorId: string | null = null;
  let receptionistId: string | null = null;

  try {
    const res = await requirePermission(req, "appointment.create");
    actorId = res.session?.user?.id ?? null;

    // Get receptionist ID if user is a receptionist
    if (actorId) {
      const receptionist = await prisma.receptionist.findUnique({
        where: { userId: actorId },
      });
      receptionistId = receptionist?.id ?? null;
    }
  } catch (err) {
    console.error('[Appointment POST] Permission denied:', err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Validate required fields
  if (!body.patientId || !body.doctorId || !body.dateTime || !body.reason) {
    console.error('[Appointment POST] Missing fields:', { patientId: body.patientId, doctorId: body.doctorId, dateTime: body.dateTime, reason: body.reason });
    return NextResponse.json(
      {
        error: "Missing required fields: patientId, doctorId, dateTime, reason",
      },
      { status: 400 },
    );
  }

  // Build appointment notes with metadata if severity/problemCategory provided
  let notesData: string | null = body.notes || null;
  
  if (body.severity && body.problemCategory) {
    // Validate severity
    if (!SEVERITY_LEVELS[body.severity as SeverityLevel]) {
      return NextResponse.json(
        { error: `Invalid severity: ${body.severity}. Valid values: LOW, MODERATE, HIGH` },
        { status: 400 },
      );
    }
    
    // Validate problem category
    if (!PROBLEM_TYPES[body.problemCategory as ProblemCategory]) {
      return NextResponse.json(
        { error: `Invalid problemCategory: ${body.problemCategory}` },
        { status: 400 },
      );
    }

    const metadata: AppointmentMetadata = {
      severity: body.severity as SeverityLevel,
      problemCategory: body.problemCategory as ProblemCategory,
      problemDescription: body.problemDescription,
      symptoms: body.symptoms,
      autoAssigned: body.autoAssigned || false,
      assignmentReason: body.assignmentReason,
      originalNotes: body.notes,
    };
    
    notesData = stringifyAppointmentMetadata(metadata);
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        receptionistId: receptionistId,
        dateTime: new Date(body.dateTime),
        reason: body.reason,
        notes: notesData,
        status: "SCHEDULED",
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    await createAudit({
      actorId,
      action: "appointment.create",
      resource: "Appointment",
      resourceId: appointment.id,
      meta: {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        dateTime: appointment.dateTime,
      },
    });

    console.log('[Appointment POST] Successfully created:', appointment.id);
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('[Appointment POST] Creation failed:', error);
    return NextResponse.json(
      { error: "Failed to create appointment", details: String(error) },
      { status: 500 },
    );
  }
}

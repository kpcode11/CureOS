/**
 * Doctor Shift Configuration API
 * 
 * Manages doctor seniority levels, shift assignments, and availability.
 * This data is stored in-memory and can be persisted to a JSON file.
 * 
 * Endpoints:
 * - GET: List all doctor configurations
 * - POST: Create/update a doctor's configuration
 * - DELETE: Remove a doctor's configuration
 */

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import {
  getAllDoctorConfigs,
  setDoctorConfig,
  getDoctorConfig,
  initializeDoctorConfigs,
} from '@/services/scheduling.service';
import {
  SeniorityLevel,
  ShiftType,
  DoctorShiftConfig,
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
 * GET /api/doctor-shifts
 * Get all doctor shift configurations
 * 
 * Query params:
 * - doctorId: Get specific doctor's config
 */
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'doctor.read');
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureInitialized();

  const url = new URL(req.url);
  const doctorId = url.searchParams.get('doctorId');

  if (doctorId) {
    const config = getDoctorConfig(doctorId);
    if (!config) {
      return NextResponse.json(
        { error: 'Doctor configuration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(config);
  }

  const configs = getAllDoctorConfigs();
  return NextResponse.json(configs);
}

/**
 * POST /api/doctor-shifts
 * Create or update a doctor's shift configuration
 * 
 * Body:
 * - doctorId: string (required)
 * - seniority: 'HOD' | 'SENIOR' | 'JUNIOR' (required)
 * - shifts: ShiftType[] (required)
 * - availableDays: number[] (required, 0-6)
 * - isActive: boolean (optional, default true)
 */
export async function POST(req: Request) {
  try {
    await requirePermission(req, 'admin.settings');
  } catch {
    // Also allow doctors to update their own config
    try {
      await requirePermission(req, 'doctor.read');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  await ensureInitialized();

  const body = await req.json();

  // Validate required fields
  if (!body.doctorId) {
    return NextResponse.json(
      { error: 'doctorId is required' },
      { status: 400 }
    );
  }

  if (!body.seniority || !['HOD', 'SENIOR', 'JUNIOR'].includes(body.seniority)) {
    return NextResponse.json(
      { error: 'seniority must be HOD, SENIOR, or JUNIOR' },
      { status: 400 }
    );
  }

  const validShifts: ShiftType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  if (!body.shifts || !Array.isArray(body.shifts)) {
    return NextResponse.json(
      { error: 'shifts must be an array of shift types' },
      { status: 400 }
    );
  }

  for (const shift of body.shifts) {
    if (!validShifts.includes(shift)) {
      return NextResponse.json(
        { error: `Invalid shift: ${shift}. Valid values: ${validShifts.join(', ')}` },
        { status: 400 }
      );
    }
  }

  if (!body.availableDays || !Array.isArray(body.availableDays)) {
    return NextResponse.json(
      { error: 'availableDays must be an array of numbers (0-6)' },
      { status: 400 }
    );
  }

  for (const day of body.availableDays) {
    if (typeof day !== 'number' || day < 0 || day > 6) {
      return NextResponse.json(
        { error: 'availableDays must contain numbers 0-6 (Sunday-Saturday)' },
        { status: 400 }
      );
    }
  }

  const config: DoctorShiftConfig = {
    doctorId: body.doctorId,
    seniority: body.seniority as SeniorityLevel,
    shifts: body.shifts as ShiftType[],
    availableDays: body.availableDays as number[],
    isActive: body.isActive !== false, // Default to true
  };

  setDoctorConfig(config);

  return NextResponse.json({
    success: true,
    message: 'Doctor configuration updated',
    config,
  });
}

/**
 * PUT /api/doctor-shifts
 * Bulk update doctor configurations
 * 
 * Body:
 * - configs: DoctorShiftConfig[]
 */
export async function PUT(req: Request) {
  try {
    await requirePermission(req, 'admin.settings');
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureInitialized();

  const body = await req.json();

  if (!body.configs || !Array.isArray(body.configs)) {
    return NextResponse.json(
      { error: 'configs must be an array of doctor configurations' },
      { status: 400 }
    );
  }

  let updated = 0;
  for (const config of body.configs) {
    if (config.doctorId && config.seniority && config.shifts && config.availableDays) {
      setDoctorConfig(config);
      updated++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Updated ${updated} doctor configurations`,
    count: updated,
  });
}

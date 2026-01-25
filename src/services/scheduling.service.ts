/**
 * Smart Doctor Scheduling Service
 * 
 * This service implements the intelligent doctor assignment algorithm that:
 * 1. Considers patient severity (HIGH requires senior doctors)
 * 2. Matches problem category to doctor specialization
 * 3. Checks doctor shift availability for the appointment time
 * 4. Prioritizes by seniority based on severity
 * 5. Falls back to available alternatives when optimal match isn't found
 */

import { prisma } from '@/lib/prisma';
import {
  SeverityLevel,
  ProblemCategory,
  SeniorityLevel,
  ShiftType,
  DoctorShiftConfig,
  DoctorAssignmentResult,
  PROBLEM_TYPES,
  SENIORITY_DEFINITIONS,
  getShiftForHour,
  isSenioritySufficientForSeverity,
} from '@/types/scheduling';

// ============================================================================
// In-Memory Doctor Configuration Store
// ============================================================================

/**
 * In-memory store for doctor shift configurations
 * In production, this could be moved to a database table or Redis cache
 * 
 * Key: doctorId
 * Value: DoctorShiftConfig
 */
const doctorConfigStore = new Map<string, DoctorShiftConfig>();

// ============================================================================
// Doctor Configuration Management
// ============================================================================

/**
 * Sets or updates a doctor's shift configuration
 */
export function setDoctorConfig(config: DoctorShiftConfig): void {
  doctorConfigStore.set(config.doctorId, config);
}

/**
 * Gets a doctor's shift configuration
 */
export function getDoctorConfig(doctorId: string): DoctorShiftConfig | undefined {
  return doctorConfigStore.get(doctorId);
}

/**
 * Gets all doctor configurations
 */
export function getAllDoctorConfigs(): DoctorShiftConfig[] {
  return Array.from(doctorConfigStore.values());
}

/**
 * Removes a doctor's configuration
 */
export function removeDoctorConfig(doctorId: string): boolean {
  return doctorConfigStore.delete(doctorId);
}

/**
 * Clears all doctor configurations
 */
export function clearAllDoctorConfigs(): void {
  doctorConfigStore.clear();
}

/**
 * Initialize with default configurations for existing doctors
 * This is called on first load or can be triggered to sync with database
 */
export async function initializeDoctorConfigs(): Promise<void> {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    for (const doctor of doctors) {
      // Only set config if not already configured
      if (!doctorConfigStore.has(doctor.id)) {
        // Default: All doctors as JUNIOR working all shifts, all days
        const defaultConfig: DoctorShiftConfig = {
          doctorId: doctor.id,
          seniority: 'JUNIOR', // Default seniority
          shifts: ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'], // All shifts by default
          availableDays: [0, 1, 2, 3, 4, 5, 6], // All days
          isActive: true,
        };
        doctorConfigStore.set(doctor.id, defaultConfig);
      }
    }
    
    console.log(`[Scheduling] Initialized ${doctors.length} doctor configurations`);
  } catch (error) {
    console.error('[Scheduling] Failed to initialize doctor configs:', error);
  }
}

// ============================================================================
// Core Scheduling Algorithm
// ============================================================================

interface DoctorWithDetails {
  id: string;
  userId: string;
  specialization: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  config?: DoctorShiftConfig;
}

/**
 * Main algorithm: Find the best doctor for a patient based on:
 * 1. Problem category → Required specialization
 * 2. Appointment time → Doctor's shift availability
 * 3. Severity → Required seniority level
 * 4. Prioritize higher seniority for high severity cases
 */
export async function findBestAvailableDoctor(
  problemCategory: ProblemCategory,
  severity: SeverityLevel,
  appointmentDateTime: Date,
  excludeDoctorIds: string[] = []
): Promise<DoctorAssignmentResult> {
  try {
    // Step 1: Get required specializations for the problem
    const problemType = PROBLEM_TYPES[problemCategory];
    if (!problemType) {
      return {
        success: false,
        reason: `Unknown problem category: ${problemCategory}`,
      };
    }

    const requiredSpecializations = problemType.requiredSpecializations;
    
    // Step 2: Determine the shift for the appointment time
    const appointmentHour = appointmentDateTime.getHours();
    const appointmentDay = appointmentDateTime.getDay(); // 0=Sunday, 6=Saturday
    const currentShift = getShiftForHour(appointmentHour);
    
    // Step 3: Fetch all doctors with matching specializations
    const doctors = await prisma.doctor.findMany({
      where: {
        id: { notIn: excludeDoctorIds },
        OR: requiredSpecializations.map(spec => ({
          specialization: { contains: spec, mode: 'insensitive' as const }
        }))
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (doctors.length === 0) {
      // No specialists found, try general practitioners for non-critical cases
      if (severity !== 'HIGH') {
        const generalDoctors = await prisma.doctor.findMany({
          where: {
            id: { notIn: excludeDoctorIds },
            OR: [
              { specialization: { contains: 'General', mode: 'insensitive' } },
              { specialization: { contains: 'Internal', mode: 'insensitive' } },
              { specialization: { contains: 'Family', mode: 'insensitive' } },
            ]
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        if (generalDoctors.length > 0) {
          const generalDoctor = generalDoctors[0];
          const config = getDoctorConfig(generalDoctor.id);
          return {
            success: true,
            doctor: {
              id: generalDoctor.id,
              userId: generalDoctor.userId,
              name: generalDoctor.user.name,
              specialization: generalDoctor.specialization,
              seniority: config?.seniority || 'JUNIOR',
              email: generalDoctor.user.email,
            },
            reason: `No ${problemType.label} specialist available. Assigned general practitioner.`,
          };
        }
      }

      return {
        success: false,
        reason: `No doctors available for ${problemType.label} problems. Required specializations: ${requiredSpecializations.join(', ')}`,
      };
    }

    // Step 4: Enrich doctors with their configurations
    const doctorsWithConfig: DoctorWithDetails[] = doctors.map(doctor => ({
      ...doctor,
      config: getDoctorConfig(doctor.id),
    }));

    // Step 5: Filter doctors by shift availability
    const availableDoctors = doctorsWithConfig.filter(doctor => {
      const config = doctor.config;
      
      // If no config, consider doctor as available (default)
      if (!config) return true;
      
      // Check if doctor is active
      if (!config.isActive) return false;
      
      // Check if doctor works on this day
      if (!config.availableDays.includes(appointmentDay)) return false;
      
      // Check if doctor works this shift
      if (!config.shifts.includes(currentShift)) return false;
      
      return true;
    });

    if (availableDoctors.length === 0) {
      // Return alternatives even if not on shift
      const alternatives = doctorsWithConfig
        .filter(d => d.config?.isActive !== false)
        .slice(0, 3)
        .map(d => ({
          id: d.id,
          name: d.user.name,
          specialization: d.specialization,
          seniority: d.config?.seniority || 'JUNIOR' as SeniorityLevel,
          reason: 'Not on shift for this time slot',
        }));

      return {
        success: false,
        reason: `No ${problemType.label} specialists available for ${currentShift.toLowerCase()} shift on this day`,
        alternativeDoctors: alternatives,
      };
    }

    // Step 6: Sort by seniority based on severity requirement
    const sortedDoctors = sortDoctorsBySeverityMatch(availableDoctors, severity);

    // Step 7: Select the best match
    const selectedDoctor = sortedDoctors[0];
    const config = selectedDoctor.config;
    const seniority = config?.seniority || 'JUNIOR';

    // Check if seniority is sufficient for severity
    const isSufficient = isSenioritySufficientForSeverity(seniority, severity);
    
    let assignmentReason: string;
    if (severity === 'HIGH') {
      if (seniority === 'HOD') {
        assignmentReason = `Assigned HOD for high severity ${problemType.label} case during ${currentShift.toLowerCase()} shift`;
      } else if (seniority === 'SENIOR') {
        assignmentReason = `Assigned senior doctor for high severity ${problemType.label} case during ${currentShift.toLowerCase()} shift`;
      } else {
        assignmentReason = `⚠️ Assigned junior doctor for high severity case - senior doctors unavailable. Recommend supervision.`;
      }
    } else if (severity === 'MODERATE') {
      assignmentReason = `Assigned ${seniority.toLowerCase()} doctor for moderate severity ${problemType.label} case`;
    } else {
      assignmentReason = `Assigned ${seniority.toLowerCase()} doctor for routine ${problemType.label} consultation`;
    }

    // Collect alternatives (other available doctors)
    const alternativeDoctors = sortedDoctors.slice(1, 4).map(d => ({
      id: d.id,
      name: d.user.name,
      specialization: d.specialization,
      seniority: d.config?.seniority || 'JUNIOR' as SeniorityLevel,
      reason: `Alternative ${d.config?.seniority?.toLowerCase() || 'junior'} doctor available`,
    }));

    return {
      success: true,
      doctor: {
        id: selectedDoctor.id,
        userId: selectedDoctor.userId,
        name: selectedDoctor.user.name,
        specialization: selectedDoctor.specialization,
        seniority,
        email: selectedDoctor.user.email,
      },
      reason: assignmentReason,
      alternativeDoctors,
    };

  } catch (error) {
    console.error('[Scheduling] Error finding best doctor:', error);
    return {
      success: false,
      reason: `System error while finding available doctor: ${String(error)}`,
    };
  }
}

/**
 * Sort doctors by seniority based on severity requirements
 * - HIGH severity: Prefer HOD > SENIOR > JUNIOR
 * - MODERATE severity: Prefer SENIOR > JUNIOR > HOD (preserve HOD for critical)
 * - LOW severity: Prefer JUNIOR > SENIOR > HOD (preserve senior staff for complex cases)
 */
function sortDoctorsBySeverityMatch(
  doctors: DoctorWithDetails[],
  severity: SeverityLevel
): DoctorWithDetails[] {
  const getSeniorityRank = (config?: DoctorShiftConfig): number => {
    if (!config) return 1; // Default to junior
    return SENIORITY_DEFINITIONS[config.seniority].rank;
  };

  return [...doctors].sort((a, b) => {
    const rankA = getSeniorityRank(a.config);
    const rankB = getSeniorityRank(b.config);

    if (severity === 'HIGH') {
      // For high severity, prefer higher seniority
      return rankB - rankA; // Descending: HOD(3) > SENIOR(2) > JUNIOR(1)
    } else if (severity === 'MODERATE') {
      // For moderate, prefer senior but not HOD (preserve HOD for critical)
      const adjustedRankA = rankA === 3 ? 1.5 : rankA; // Demote HOD slightly
      const adjustedRankB = rankB === 3 ? 1.5 : rankB;
      return adjustedRankB - adjustedRankA;
    } else {
      // For low severity, prefer junior to preserve senior staff
      return rankA - rankB; // Ascending: JUNIOR(1) > SENIOR(2) > HOD(3)
    }
  });
}

// ============================================================================
// Appointment Availability Check
// ============================================================================

/**
 * Check if a specific doctor is available at a given time
 * (Not double-booked with another appointment)
 */
export async function isDoctorAvailableAtTime(
  doctorId: string,
  dateTime: Date,
  durationMinutes: number = 30
): Promise<{ available: boolean; conflictingAppointment?: { id: string; dateTime: Date } }> {
  try {
    const startTime = dateTime;
    const endTime = new Date(dateTime.getTime() + durationMinutes * 60 * 1000);
    
    // Check for overlapping appointments
    const conflicting = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { in: ['SCHEDULED'] },
        dateTime: {
          gte: new Date(startTime.getTime() - durationMinutes * 60 * 1000),
          lt: endTime,
        },
      },
      select: { id: true, dateTime: true },
    });

    if (conflicting) {
      return {
        available: false,
        conflictingAppointment: { id: conflicting.id, dateTime: conflicting.dateTime },
      };
    }

    return { available: true };
  } catch (error) {
    console.error('[Scheduling] Error checking doctor availability:', error);
    return { available: false };
  }
}

/**
 * Get all available time slots for a doctor on a given date
 */
export async function getDoctorAvailableSlots(
  doctorId: string,
  date: Date,
  slotDurationMinutes: number = 30
): Promise<Date[]> {
  const config = getDoctorConfig(doctorId);
  const dayOfWeek = date.getDay();
  
  // Check if doctor works on this day
  if (config && !config.availableDays.includes(dayOfWeek)) {
    return [];
  }

  // Get doctor's shifts for the day
  const shifts = config?.shifts || ['MORNING', 'AFTERNOON', 'EVENING'];
  
  // Get existing appointments for the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: 'SCHEDULED',
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: { dateTime: true },
  });

  const bookedTimes = new Set(
    existingAppointments.map(a => a.dateTime.getTime())
  );

  // Generate available slots based on shifts
  const availableSlots: Date[] = [];
  
  const shiftHours: Record<ShiftType, { start: number; end: number }> = {
    MORNING: { start: 6, end: 12 },
    AFTERNOON: { start: 12, end: 18 },
    EVENING: { start: 18, end: 22 },
    NIGHT: { start: 22, end: 24 }, // Only until midnight for next-day booking
  };

  for (const shift of shifts) {
    const hours = shiftHours[shift];
    for (let hour = hours.start; hour < hours.end; hour++) {
      for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip if in the past
        if (slotTime < new Date()) continue;
        
        // Skip if already booked
        if (bookedTimes.has(slotTime.getTime())) continue;
        
        availableSlots.push(slotTime);
      }
    }
  }

  return availableSlots;
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Update multiple doctor configurations at once
 */
export function bulkSetDoctorConfigs(configs: DoctorShiftConfig[]): void {
  for (const config of configs) {
    setDoctorConfig(config);
  }
}

/**
 * Export current configurations as JSON (for backup/restore)
 */
export function exportDoctorConfigs(): string {
  const configs = getAllDoctorConfigs();
  return JSON.stringify(configs, null, 2);
}

/**
 * Import configurations from JSON
 */
export function importDoctorConfigs(json: string): { success: boolean; count: number; error?: string } {
  try {
    const configs = JSON.parse(json) as DoctorShiftConfig[];
    bulkSetDoctorConfigs(configs);
    return { success: true, count: configs.length };
  } catch (error) {
    return { success: false, count: 0, error: String(error) };
  }
}

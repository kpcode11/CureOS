import { prisma } from '@/lib/prisma';
import {
  SeverityLevel,
  ProblemCategory,
  SeniorityLevel,
  ShiftType,
  PROBLEM_TO_SPECIALIZATION,
  SENIORITY_PRIORITY,
  DoctorRecommendation,
  getShiftTypeForTime,
} from '@/types/scheduling';

interface DoctorWithDetails {
  id: string;
  specialization: string;
  seniority: SeniorityLevel;
  user: {
    id: string;
    name: string;
    email: string;
  };
  shifts: Array<{
    id: string;
    shiftType: ShiftType;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  appointments: Array<{
    id: string;
    dateTime: Date;
    status: string;
  }>;
}

/**
 * Find the best available doctor based on problem category, severity, and shift availability
 */
export async function findBestAvailableDoctor(
  problemCategory: ProblemCategory,
  severity: SeverityLevel,
  requestedDateTime: Date,
): Promise<DoctorRecommendation> {
  // Get required specializations for the problem
  const requiredSpecs = PROBLEM_TO_SPECIALIZATION[problemCategory];
  
  // Get the day of week and time
  const dayOfWeek = requestedDateTime.getDay();
  const timeStr = requestedDateTime.toTimeString().slice(0, 5); // "HH:mm"
  const shiftType = getShiftTypeForTime(timeStr);
  
  // Find doctors with matching specialization
  const doctors = await prisma.doctor.findMany({
    where: {
      specialization: {
        in: requiredSpecs,
        mode: 'insensitive',
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      shifts: {
        where: {
          isActive: true,
          dayOfWeek: dayOfWeek,
        },
      },
      appointments: {
        where: {
          dateTime: {
            gte: new Date(requestedDateTime.setHours(0, 0, 0, 0)),
            lt: new Date(requestedDateTime.setHours(23, 59, 59, 999)),
          },
          status: {
            in: ['SCHEDULED'],
          },
        },
      },
    },
  }) as unknown as DoctorWithDetails[];
  
  if (doctors.length === 0) {
    return {
      success: false,
      reason: `No doctors found with specialization for ${problemCategory.replace('_', ' ')}`,
    };
  }
  
  // Filter doctors who are available on the requested shift
  const availableDoctors = doctors.filter((doctor) => {
    // Check if doctor has a shift on this day and time
    const hasShift = doctor.shifts.some((shift) => {
      if (shift.shiftType === shiftType) return true;
      // Check if time falls within any of their shifts
      return timeStr >= shift.startTime && timeStr < shift.endTime;
    });
    
    // If no shifts defined, assume available (legacy doctors)
    if (doctor.shifts.length === 0) return true;
    
    return hasShift;
  });
  
  if (availableDoctors.length === 0) {
    return {
      success: false,
      reason: `No doctors with ${problemCategory.replace('_', ' ')} specialty available during ${shiftType.toLowerCase()} shift`,
      alternativeDoctors: doctors.slice(0, 3).map((d) => ({
        id: d.id,
        name: d.user.name,
        specialization: d.specialization,
        seniority: d.seniority,
      })),
    };
  }
  
  // Sort by seniority priority based on severity
  const seniorityOrder = SENIORITY_PRIORITY[severity];
  const sortedDoctors = [...availableDoctors].sort((a, b) => {
    const aIndex = seniorityOrder.indexOf(a.seniority);
    const bIndex = seniorityOrder.indexOf(b.seniority);
    return aIndex - bIndex;
  });
  
  // Check appointment conflicts and find the best available doctor
  for (const doctor of sortedDoctors) {
    // Check if doctor has conflicting appointment at the exact time
    const hasConflict = doctor.appointments.some((apt) => {
      const aptTime = new Date(apt.dateTime);
      const timeDiff = Math.abs(aptTime.getTime() - requestedDateTime.getTime());
      // Consider conflict if within 30 minutes
      return timeDiff < 30 * 60 * 1000;
    });
    
    if (!hasConflict) {
      return {
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.user.name,
          specialization: doctor.specialization,
          seniority: doctor.seniority,
        },
        availableSlot: {
          date: requestedDateTime.toISOString().split('T')[0],
          time: timeStr,
          shiftType: shiftType,
        },
        reason: `${doctor.seniority} doctor matched for ${severity} severity ${problemCategory.replace('_', ' ')} case`,
        alternativeDoctors: sortedDoctors
          .filter((d) => d.id !== doctor.id)
          .slice(0, 2)
          .map((d) => ({
            id: d.id,
            name: d.user.name,
            specialization: d.specialization,
            seniority: d.seniority,
          })),
      };
    }
  }
  
  // All doctors have conflicts, return first available with alternatives
  return {
    success: false,
    reason: 'All matching doctors have scheduling conflicts at the requested time',
    alternativeDoctors: sortedDoctors.slice(0, 3).map((d) => ({
      id: d.id,
      name: d.user.name,
      specialization: d.specialization,
      seniority: d.seniority,
    })),
  };
}

/**
 * Get available time slots for a specific doctor on a given date
 */
export async function getDoctorAvailableSlots(
  doctorId: string,
  date: Date,
): Promise<string[]> {
  const dayOfWeek = date.getDay();
  
  // Get doctor's shifts for this day
  const shifts = await prisma.doctorShift.findMany({
    where: {
      doctorId,
      dayOfWeek,
      isActive: true,
    },
  });
  
  // Get existing appointments for this day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: 'SCHEDULED',
    },
    select: {
      dateTime: true,
    },
  });
  
  const bookedTimes = new Set(
    appointments.map((a) => a.dateTime.toTimeString().slice(0, 5)),
  );
  
  // Generate available slots based on shifts
  const availableSlots: string[] = [];
  
  for (const shift of shifts) {
    let currentTime = shift.startTime;
    while (currentTime < shift.endTime) {
      if (!bookedTimes.has(currentTime)) {
        availableSlots.push(currentTime);
      }
      // Increment by 30 minutes
      const [hours, minutes] = currentTime.split(':').map(Number);
      const newMinutes = minutes + 30;
      if (newMinutes >= 60) {
        currentTime = `${String(hours + 1).padStart(2, '0')}:${String(newMinutes - 60).padStart(2, '0')}`;
      } else {
        currentTime = `${String(hours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      }
    }
  }
  
  return availableSlots.sort();
}

/**
 * Create or update doctor shift schedule
 */
export async function upsertDoctorShift(
  doctorId: string,
  shiftType: ShiftType,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
) {
  return prisma.doctorShift.upsert({
    where: {
      doctorId_shiftType_dayOfWeek: {
        doctorId,
        shiftType,
        dayOfWeek,
      },
    },
    update: {
      startTime,
      endTime,
      isActive: true,
    },
    create: {
      doctorId,
      shiftType,
      dayOfWeek,
      startTime,
      endTime,
      isActive: true,
    },
  });
}

/**
 * Get all shifts for a doctor
 */
export async function getDoctorShifts(doctorId: string) {
  return prisma.doctorShift.findMany({
    where: { doctorId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

/**
 * Update doctor seniority level
 */
export async function updateDoctorSeniority(
  doctorId: string,
  seniority: SeniorityLevel,
) {
  return prisma.doctor.update({
    where: { id: doctorId },
    data: { seniority },
  });
}

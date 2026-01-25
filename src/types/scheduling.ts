// Types matching Prisma schema enums for smart scheduling

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type ProblemCategory = 
  | 'HEART'
  | 'BONE_JOINT'
  | 'EAR_NOSE_THROAT'
  | 'EYE'
  | 'SKIN'
  | 'DIGESTIVE'
  | 'RESPIRATORY'
  | 'NEUROLOGICAL'
  | 'DENTAL'
  | 'GENERAL'
  | 'PEDIATRIC'
  | 'GYNECOLOGY'
  | 'UROLOGY'
  | 'MENTAL_HEALTH';

export type SeniorityLevel = 'HOD' | 'SENIOR' | 'JUNIOR';

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

// Shift time ranges
export const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  MORNING: { start: '06:00', end: '12:00' },
  AFTERNOON: { start: '12:00', end: '18:00' },
  EVENING: { start: '18:00', end: '22:00' },
  NIGHT: { start: '22:00', end: '06:00' },
};

// Problem category to required specialization mapping
export const PROBLEM_TO_SPECIALIZATION: Record<ProblemCategory, string[]> = {
  HEART: ['Cardiology', 'Cardiologist', 'Internal Medicine'],
  BONE_JOINT: ['Orthopedics', 'Orthopedic Surgery', 'Sports Medicine'],
  EAR_NOSE_THROAT: ['ENT', 'Otolaryngology', 'Otorhinolaryngology'],
  EYE: ['Ophthalmology', 'Optometry'],
  SKIN: ['Dermatology', 'Dermatologist'],
  DIGESTIVE: ['Gastroenterology', 'Internal Medicine', 'Hepatology'],
  RESPIRATORY: ['Pulmonology', 'Pulmonary Medicine', 'Internal Medicine'],
  NEUROLOGICAL: ['Neurology', 'Neurosurgery', 'Neurologist'],
  DENTAL: ['Dentistry', 'Dental Surgery', 'Oral Surgery'],
  GENERAL: ['General Medicine', 'Internal Medicine', 'Family Medicine', 'General Practice'],
  PEDIATRIC: ['Pediatrics', 'Pediatric Medicine', 'Child Health'],
  GYNECOLOGY: ['Gynecology', 'Obstetrics', 'OB/GYN', 'OBGYN'],
  UROLOGY: ['Urology', 'Urologist', 'Nephrology'],
  MENTAL_HEALTH: ['Psychiatry', 'Psychology', 'Mental Health'],
};

// Seniority priority for severity matching
export const SENIORITY_PRIORITY: Record<SeverityLevel, SeniorityLevel[]> = {
  HIGH: ['HOD', 'SENIOR', 'JUNIOR'], // High severity prefers HOD first
  MODERATE: ['SENIOR', 'HOD', 'JUNIOR'], // Moderate prefers Senior
  LOW: ['JUNIOR', 'SENIOR', 'HOD'], // Low severity can be handled by Junior
};

// Doctor shift schedule interface
export interface DoctorShift {
  id: string;
  doctorId: string;
  shiftType: ShiftType;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string;
  endTime: string;
  isActive: boolean;
}

// Doctor with scheduling info
export interface DoctorWithScheduling {
  id: string;
  userId: string;
  specialization: string;
  seniority: SeniorityLevel;
  shifts: DoctorShift[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// Smart appointment request
export interface SmartAppointmentRequest {
  patientId: string;
  severity: SeverityLevel;
  problemCategory: ProblemCategory;
  symptoms?: string[];
  preferredDate: string; // ISO date string
  preferredTime?: string; // Optional preferred time
  notes?: string;
}

// Doctor recommendation result
export interface DoctorRecommendation {
  success: boolean;
  doctor?: {
    id: string;
    name: string;
    specialization: string;
    seniority: SeniorityLevel;
  };
  availableSlot?: {
    date: string;
    time: string;
    shiftType: ShiftType;
  };
  reason: string;
  alternativeDoctors?: Array<{
    id: string;
    name: string;
    specialization: string;
    seniority: SeniorityLevel;
  }>;
}

// Utility function to get current shift type based on time
export function getCurrentShiftType(time: Date = new Date()): ShiftType {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  if (timeStr >= '06:00' && timeStr < '12:00') return 'MORNING';
  if (timeStr >= '12:00' && timeStr < '18:00') return 'AFTERNOON';
  if (timeStr >= '18:00' && timeStr < '22:00') return 'EVENING';
  return 'NIGHT';
}

// Check if a time falls within a shift
export function isTimeInShift(time: string, shiftType: ShiftType): boolean {
  const shift = SHIFT_TIMES[shiftType];
  
  // Handle night shift spanning midnight
  if (shiftType === 'NIGHT') {
    return time >= shift.start || time < shift.end;
  }
  
  return time >= shift.start && time < shift.end;
}

// Get shift type for a given time string
export function getShiftTypeForTime(time: string): ShiftType {
  if (time >= '06:00' && time < '12:00') return 'MORNING';
  if (time >= '12:00' && time < '18:00') return 'AFTERNOON';
  if (time >= '18:00' && time < '22:00') return 'EVENING';
  return 'NIGHT';
}

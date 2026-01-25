/**
 * Smart Appointment Scheduling Types
 * 
 * This module defines types for intelligent doctor assignment based on:
 * - Patient severity (low, moderate, high)
 * - Problem type (mapped to medical specializations)
 * - Doctor shifts (morning, afternoon, evening, night)
 * - Doctor seniority (HOD, Senior, Junior)
 */

// ============================================================================
// Severity Levels
// ============================================================================

export type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH';

export const SEVERITY_LEVELS: Record<SeverityLevel, { label: string; priority: number; color: string }> = {
  LOW: { label: 'Low', priority: 1, color: 'green' },
  MODERATE: { label: 'Moderate', priority: 2, color: 'yellow' },
  HIGH: { label: 'High', priority: 3, color: 'red' },
};

// ============================================================================
// Problem Types (Medical Categories)
// ============================================================================

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

export interface ProblemType {
  category: ProblemCategory;
  label: string;
  description: string;
  requiredSpecializations: string[]; // Maps to Doctor.specialization
  examples: string[];
}

export const PROBLEM_TYPES: Record<ProblemCategory, ProblemType> = {
  HEART: {
    category: 'HEART',
    label: 'Heart/Cardiac',
    description: 'Heart and cardiovascular related issues',
    requiredSpecializations: ['Cardiology', 'Cardiac Surgery', 'Cardiovascular Medicine'],
    examples: ['Chest pain', 'Palpitations', 'Heart murmur', 'High blood pressure'],
  },
  BONE_JOINT: {
    category: 'BONE_JOINT',
    label: 'Bone & Joint',
    description: 'Orthopedic and musculoskeletal issues',
    requiredSpecializations: ['Orthopedics', 'Orthopedic Surgery', 'Sports Medicine', 'Rheumatology'],
    examples: ['Fracture', 'Joint pain', 'Back pain', 'Arthritis'],
  },
  EAR_NOSE_THROAT: {
    category: 'EAR_NOSE_THROAT',
    label: 'Ear, Nose & Throat',
    description: 'ENT related problems',
    requiredSpecializations: ['ENT', 'Otolaryngology', 'Ear Nose Throat'],
    examples: ['Hearing loss', 'Sinus issues', 'Sore throat', 'Ear infection'],
  },
  EYE: {
    category: 'EYE',
    label: 'Eye/Vision',
    description: 'Ophthalmology and vision problems',
    requiredSpecializations: ['Ophthalmology', 'Optometry', 'Eye Surgery'],
    examples: ['Vision problems', 'Eye pain', 'Cataracts', 'Glaucoma'],
  },
  SKIN: {
    category: 'SKIN',
    label: 'Skin',
    description: 'Dermatological conditions',
    requiredSpecializations: ['Dermatology', 'Skin Surgery'],
    examples: ['Rash', 'Acne', 'Skin infection', 'Eczema'],
  },
  DIGESTIVE: {
    category: 'DIGESTIVE',
    label: 'Digestive/GI',
    description: 'Gastrointestinal issues',
    requiredSpecializations: ['Gastroenterology', 'GI Surgery', 'Hepatology'],
    examples: ['Stomach pain', 'Acid reflux', 'Digestive issues', 'Liver problems'],
  },
  RESPIRATORY: {
    category: 'RESPIRATORY',
    label: 'Respiratory/Lung',
    description: 'Pulmonary and breathing problems',
    requiredSpecializations: ['Pulmonology', 'Respiratory Medicine', 'Thoracic Surgery'],
    examples: ['Breathing difficulty', 'Asthma', 'Cough', 'Lung issues'],
  },
  NEUROLOGICAL: {
    category: 'NEUROLOGICAL',
    label: 'Neurological',
    description: 'Brain and nervous system issues',
    requiredSpecializations: ['Neurology', 'Neurosurgery', 'Neurological Surgery'],
    examples: ['Headache', 'Seizures', 'Numbness', 'Memory issues'],
  },
  DENTAL: {
    category: 'DENTAL',
    label: 'Dental',
    description: 'Dental and oral health issues',
    requiredSpecializations: ['Dentistry', 'Oral Surgery', 'Dental Surgery'],
    examples: ['Toothache', 'Dental pain', 'Gum problems'],
  },
  GENERAL: {
    category: 'GENERAL',
    label: 'General/Primary Care',
    description: 'General health checkups and common issues',
    requiredSpecializations: ['General Practice', 'Internal Medicine', 'Family Medicine', 'General Medicine'],
    examples: ['Fever', 'Cold/Flu', 'Annual checkup', 'Fatigue'],
  },
  PEDIATRIC: {
    category: 'PEDIATRIC',
    label: 'Pediatric',
    description: 'Child health and development',
    requiredSpecializations: ['Pediatrics', 'Pediatric Medicine', 'Child Health'],
    examples: ['Child illness', 'Growth concerns', 'Vaccinations'],
  },
  GYNECOLOGY: {
    category: 'GYNECOLOGY',
    label: 'Gynecology/OB',
    description: 'Women\'s health and pregnancy',
    requiredSpecializations: ['Gynecology', 'Obstetrics', 'OB-GYN', 'Obstetrics and Gynecology'],
    examples: ['Pregnancy care', 'Menstrual issues', 'Women\'s health'],
  },
  UROLOGY: {
    category: 'UROLOGY',
    label: 'Urology',
    description: 'Urinary and male reproductive health',
    requiredSpecializations: ['Urology', 'Urological Surgery'],
    examples: ['Kidney stones', 'Urinary issues', 'Prostate problems'],
  },
  MENTAL_HEALTH: {
    category: 'MENTAL_HEALTH',
    label: 'Mental Health',
    description: 'Psychological and psychiatric care',
    requiredSpecializations: ['Psychiatry', 'Psychology', 'Mental Health'],
    examples: ['Anxiety', 'Depression', 'Stress', 'Sleep disorders'],
  },
};

// ============================================================================
// Doctor Shifts
// ============================================================================

export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

export interface ShiftDefinition {
  type: ShiftType;
  label: string;
  startHour: number; // 24-hour format (0-23)
  endHour: number;   // 24-hour format (0-23)
}

export const SHIFT_DEFINITIONS: Record<ShiftType, ShiftDefinition> = {
  MORNING: { type: 'MORNING', label: 'Morning', startHour: 6, endHour: 12 },
  AFTERNOON: { type: 'AFTERNOON', label: 'Afternoon', startHour: 12, endHour: 18 },
  EVENING: { type: 'EVENING', label: 'Evening', startHour: 18, endHour: 22 },
  NIGHT: { type: 'NIGHT', label: 'Night', startHour: 22, endHour: 6 }, // Wraps around midnight
};

// ============================================================================
// Doctor Seniority
// ============================================================================

export type SeniorityLevel = 'HOD' | 'SENIOR' | 'JUNIOR';

export interface SeniorityDefinition {
  level: SeniorityLevel;
  label: string;
  rank: number; // Higher rank = more senior (HOD=3, SENIOR=2, JUNIOR=1)
  canHandleSeverity: SeverityLevel[]; // What severity levels this doctor can handle
}

export const SENIORITY_DEFINITIONS: Record<SeniorityLevel, SeniorityDefinition> = {
  HOD: {
    level: 'HOD',
    label: 'Head of Department',
    rank: 3,
    canHandleSeverity: ['HIGH', 'MODERATE', 'LOW'],
  },
  SENIOR: {
    level: 'SENIOR',
    label: 'Senior Doctor',
    rank: 2,
    canHandleSeverity: ['HIGH', 'MODERATE', 'LOW'],
  },
  JUNIOR: {
    level: 'JUNIOR',
    label: 'Junior Doctor',
    rank: 1,
    canHandleSeverity: ['MODERATE', 'LOW'], // Junior doctors shouldn't handle HIGH severity alone
  },
};

// ============================================================================
// Doctor Shift Configuration
// ============================================================================

export interface DoctorShiftConfig {
  doctorId: string;
  seniority: SeniorityLevel;
  shifts: ShiftType[]; // Array of shifts the doctor works
  availableDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  isActive: boolean;
}

// ============================================================================
// Smart Appointment Metadata
// ============================================================================

/**
 * Extended appointment data stored in the notes field as JSON
 * This allows storing additional information without schema changes
 */
export interface AppointmentMetadata {
  severity: SeverityLevel;
  problemCategory: ProblemCategory;
  problemDescription?: string;
  symptoms?: string[];
  autoAssigned?: boolean; // Was doctor auto-assigned by the algorithm
  assignmentReason?: string; // Why this doctor was chosen
  originalNotes?: string; // User's original notes
}

// ============================================================================
// Doctor Assignment Result
// ============================================================================

export interface DoctorAssignmentResult {
  success: boolean;
  doctor?: {
    id: string;
    userId: string;
    name: string;
    specialization: string;
    seniority: SeniorityLevel;
    email: string;
  };
  reason: string;
  alternativeDoctors?: Array<{
    id: string;
    name: string;
    specialization: string;
    seniority: SeniorityLevel;
    reason: string;
  }>;
}

// ============================================================================
// Smart Appointment Request
// ============================================================================

export interface SmartAppointmentRequest {
  patientId: string;
  dateTime: string; // ISO date string
  severity: SeverityLevel;
  problemCategory: ProblemCategory;
  problemDescription?: string;
  symptoms?: string[];
  notes?: string;
  preferredDoctorId?: string; // Optional: specific doctor requested
  autoAssign?: boolean; // If true, automatically assign best available doctor
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determines the current shift based on the hour of the day
 */
export function getShiftForHour(hour: number): ShiftType {
  if (hour >= 6 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 18) return 'AFTERNOON';
  if (hour >= 18 && hour < 22) return 'EVENING';
  return 'NIGHT'; // 22-6
}

/**
 * Checks if a given hour falls within a shift
 */
export function isHourInShift(hour: number, shift: ShiftType): boolean {
  const def = SHIFT_DEFINITIONS[shift];
  if (shift === 'NIGHT') {
    // Night shift wraps around midnight
    return hour >= def.startHour || hour < def.endHour;
  }
  return hour >= def.startHour && hour < def.endHour;
}

/**
 * Gets the minimum required seniority level for a severity
 */
export function getRequiredSeniorityForSeverity(severity: SeverityLevel): SeniorityLevel {
  switch (severity) {
    case 'HIGH':
      return 'SENIOR'; // At least senior doctor for high severity
    case 'MODERATE':
      return 'JUNIOR'; // Junior can handle moderate
    case 'LOW':
      return 'JUNIOR'; // Junior can handle low
    default:
      return 'JUNIOR';
  }
}

/**
 * Checks if a doctor's seniority is sufficient for a given severity
 */
export function isSenioritySufficientForSeverity(
  seniority: SeniorityLevel,
  severity: SeverityLevel
): boolean {
  const seniorityDef = SENIORITY_DEFINITIONS[seniority];
  return seniorityDef.canHandleSeverity.includes(severity);
}

/**
 * Parses appointment notes to extract metadata
 */
export function parseAppointmentMetadata(notes: string | null): AppointmentMetadata | null {
  if (!notes) return null;
  
  try {
    // Check if notes is JSON (starts with {)
    if (notes.trim().startsWith('{')) {
      return JSON.parse(notes) as AppointmentMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Stringifies metadata to store in notes field
 */
export function stringifyAppointmentMetadata(
  metadata: AppointmentMetadata,
  originalNotes?: string
): string {
  const data: AppointmentMetadata = {
    ...metadata,
    originalNotes: originalNotes || metadata.originalNotes,
  };
  return JSON.stringify(data);
}

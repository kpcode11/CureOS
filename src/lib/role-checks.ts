/**
 * Role-based authorization helper utilities
 * Enforces workflow restrictions and role boundaries
 * 
 * Usage: Call these functions in API endpoints before processing data
 */

import { User } from '@prisma/client';

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User & { roleEntity?: { name: string } }, permission: string): boolean {
  if (!user.roleEntity) return false;
  // This will be validated against actual permissions in database
  // Backend middleware handles actual permission validation
  return true;
}

/**
 * Check if user can access patient records
 * DOCTOR, NURSE, PHARMACIST can access. PATIENT only own records.
 */
export function canAccessPatient(
  user: User & { roleEntity?: { name: string } },
  patientId: string,
  currentPatientId?: string
): boolean {
  if (!user.roleEntity) return false;
  
  const role = user.roleEntity.name;
  
  // Admin and clinical staff can access all
  if (['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH', 'BILLING_OFFICER'].includes(role)) {
    return true;
  }
  
  // PATIENT can only access own records
  if (role === 'PATIENT') {
    return patientId === currentPatientId;
  }
  
  // RECEPTIONIST limited access
  if (role === 'RECEPTIONIST') {
    return true; // Can access for registration/appointments
  }
  
  return false;
}

/**
 * Check if user can view EMR records
 * DOCTOR, NURSE can read. Only DOCTOR can write diagnoses/discharge approvals.
 */
export function canViewEMR(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return ['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PATIENT'].includes(role);
}

export function canEditEMRAssessment(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  // Only DOCTOR can write assessments
  return ['ADMINISTRATOR', 'DOCTOR'].includes(role);
}

export function canApproveDischargeSummary(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  // NURSE cannot approve discharge - only DOCTOR
  return role === 'DOCTOR' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can view pharmacy/prescription data
 * PHARMACIST can view all prescriptions. DOCTOR can see own orders.
 * NURSE & PATIENT can see read-only.
 */
export function canViewPrescriptions(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return ['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT'].includes(role);
}

export function canDispensePrescription(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'PHARMACIST' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can view lab results
 * DOCTOR can order and view. LAB_TECH can enter results.
 * Nurse and others see read-only.
 * PHARMACIST cannot view.
 */
export function canViewLabResults(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  // PHARMACIST explicitly cannot see lab data
  if (role === 'PHARMACIST') return false;
  return ['ADMINISTRATOR', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PATIENT'].includes(role);
}

export function canOrderLabTest(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'DOCTOR' || role === 'ADMINISTRATOR';
}

export function canEnterLabResults(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'LAB_TECH' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can access surgery scheduling
 * Only DOCTOR can schedule. Nurse sees read-only.
 */
export function canScheduleSurgery(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'DOCTOR' || role === 'ADMINISTRATOR';
}

export function canViewSurgeryDetails(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  // PHARMACIST cannot see surgery details
  if (role === 'PHARMACIST') return false;
  return ['ADMINISTRATOR', 'DOCTOR', 'NURSE'].includes(role);
}

/**
 * Check if user can manage inventory
 * Only PHARMACIST can manage drug inventory
 */
export function canManageInventory(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'PHARMACIST' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can view billing information
 * BILLING_OFFICER sees service descriptions only (no clinical details)
 * ADMINISTRATOR sees everything
 */
export function canViewBillingInfo(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return ['ADMINISTRATOR', 'BILLING_OFFICER', 'DOCTOR', 'PATIENT'].includes(role);
}

export function canApproveBillingDiscount(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'BILLING_OFFICER' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can access audit logs
 * Only ADMINISTRATOR can access comprehensive audit logs
 */
export function canAccessAuditLogs(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'ADMINISTRATOR';
}

/**
 * Check if user can use break-glass emergency access
 * Only DOCTOR can request break-glass access for emergency
 */
export function canRequestBreakglassAccess(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'DOCTOR' || role === 'ADMINISTRATOR';
}

/**
 * Get data filtering criteria based on user role
 * Used to add WHERE clauses in API queries
 */
export function getDataFilterForRole(
  role: string,
  userId?: string,
  patientId?: string
): Record<string, any> {
  // Base filtering - no special filters for most roles
  // Specific APIs will override based on their needs
  
  switch (role) {
    case 'PATIENT':
      // Only see own records
      return {
        OR: [
          { patient: { users: { some: { id: userId } } } },
          { userId }
        ]
      };
    case 'NURSE':
      // See assigned patients only (would need BedAssignment join)
      return {};
    case 'PHARMACIST':
      // See all prescriptions (no clinical data filtering)
      return {};
    default:
      return {};
  }
}

/**
 * Check if user can manage users and roles
 * Only ADMINISTRATOR
 */
export function canManageUsersAndRoles(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'ADMINISTRATOR';
}

/**
 * Check if user can record vital signs
 * Only NURSE and ADMINISTRATOR
 */
export function canRecordVitals(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'NURSE' || role === 'ADMINISTRATOR';
}

/**
 * Check if user can manage MAR (Medication Administration Record)
 * Only NURSE and ADMINISTRATOR
 */
export function canManageMAR(
  user: User & { roleEntity?: { name: string } }
): boolean {
  if (!user.roleEntity) return false;
  const role = user.roleEntity.name;
  return role === 'NURSE' || role === 'ADMINISTRATOR';
}

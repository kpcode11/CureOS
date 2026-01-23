/**
 * Break-Glass Emergency Access System
 * 
 * Allows doctors to request temporary emergency access to patient records
 * when normal authorization is insufficient during critical situations.
 * 
 * All break-glass accesses are logged with full audit trail:
 * - Who requested access (doctor)
 * - What record was accessed
 * - When access was used
 * - For how long
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const BREAKGLASS_DURATION_MINUTES = 15; // 15-minute emergency access window
const BREAKGLASS_TOKEN_LENGTH = 32;

interface BreakglassRequest {
  doctorId: string;
  patientId: string;
  reason: string;
  approverEmail?: string; // Optional: supervisor approval
}

interface BreakglassResponse {
  token: string;
  expiresAt: Date;
  reason: string;
  doctorName: string;
}

/**
 * Request break-glass emergency access to patient records
 * 
 * Called when:
 * - Doctor needs to access records outside normal authorization (e.g., unconscious patient, emergency transfer)
 * - Emergency situation requires immediate access
 * 
 * Returns a token valid for 15 minutes with full audit logging
 */
export async function requestBreakglassAccess(request: BreakglassRequest): Promise<BreakglassResponse> {
  const { doctorId, patientId, reason, approverEmail } = request;

  // Verify doctor exists and has DOCTOR role
  const doctor = await prisma.user.findUnique({
    where: { id: doctorId },
    include: { roleEntity: true }
  });

  if (!doctor || doctor.roleEntity?.name !== 'DOCTOR') {
    throw new Error('Only doctors can request break-glass access');
  }

  // Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Generate unique token
  const token = crypto.randomBytes(BREAKGLASS_TOKEN_LENGTH).toString('hex');
  const expiresAt = new Date(Date.now() + BREAKGLASS_DURATION_MINUTES * 60 * 1000);

  // Create emergency override record
  const override = await prisma.emergencyOverride.create({
    data: {
      token,
      actorId: doctorId,
      reason,
      expiresAt,
      targetUserId: approverEmail ? undefined : patientId // Would need to resolve email to user ID
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: doctorId,
      action: 'BREAKGLASS_REQUESTED',
      resource: 'Patient',
      resourceId: patientId,
      details: { reason, expiresAt, token }
    }
  });

  // Notify administrator/supervisor of break-glass request (in production)
  // await notifyBreakglassRequest(doctor.name, patient.firstName, reason);

  return {
    token,
    expiresAt,
    reason,
    doctorName: doctor.name || 'Unknown Doctor'
  };
}

/**
 * Validate and use a break-glass token
 * 
 * Called at API level before returning sensitive data
 * Token must be valid and not expired
 */
export async function validateBreakglassToken(token: string): Promise<{
  valid: boolean;
  doctorId: string;
  reason: string;
  expiresAt: Date;
} | null> {
  const override = await prisma.emergencyOverride.findUnique({
    where: { token }
  });

  if (!override) {
    return null;
  }

  // Check if token is expired
  if (override.expiresAt < new Date()) {
    // Log expired token usage attempt
    await prisma.auditLog.create({
      data: {
        actorId: override.actorId,
        action: 'BREAKGLASS_EXPIRED_TOKEN',
        resource: 'EmergencyOverride',
        resourceId: override.id
      }
    });
    return null;
  }

  // Check if token was already used (single-use per request would be stricter)
  // For now, token remains valid for 15 minutes but each use is logged

  return {
    valid: true,
    doctorId: override.actorId,
    reason: override.reason,
    expiresAt: override.expiresAt
  };
}

/**
 * Log break-glass data access
 * Called every time sensitive data is accessed via break-glass token
 * 
 * Creates detailed audit trail showing:
 * - Which doctor accessed what data
 * - When they accessed it
 * - Why (emergency reason)
 */
export async function logBreakglassAccess(
  token: string,
  doctorId: string,
  patientId: string,
  dataType: string, // e.g., 'EMR', 'Prescriptions', 'Lab Results'
  details?: Record<string, any>
): Promise<void> {
  const override = await prisma.emergencyOverride.findUnique({
    where: { token }
  });

  if (!override) {
    throw new Error('Invalid break-glass token');
  }

  // Mark token as used
  await prisma.emergencyOverride.update({
    where: { token },
    data: { used: true }
  });

  // Log the access with full context
  await prisma.auditLog.create({
    data: {
      actorId: doctorId,
      action: 'BREAKGLASS_DATA_ACCESS',
      resource: dataType,
      resourceId: patientId,
      details: {
        reason: override.reason,
        expiresAt: override.expiresAt,
        ...details
      }
    }
  });
}

/**
 * Revoke break-glass access immediately
 * Called by administrators to revoke emergency access if needed
 */
export async function revokeBreakglassAccess(token: string, revokedBy: string): Promise<void> {
  const override = await prisma.emergencyOverride.findUnique({
    where: { token }
  });

  if (!override) {
    throw new Error('Token not found');
  }

  // Set expiration to now
  await prisma.emergencyOverride.update({
    where: { token },
    data: { expiresAt: new Date() }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: revokedBy,
      action: 'BREAKGLASS_REVOKED',
      resource: 'EmergencyOverride',
      resourceId: override.id,
      details: { originalReason: override.reason }
    }
  });
}

/**
 * Get break-glass access history for compliance/audit
 * Shows all emergency accesses in date range
 */
export async function getBreakglassAuditTrail(
  startDate?: Date,
  endDate?: Date,
  doctorId?: string
) {
  return prisma.auditLog.findMany({
    where: {
      action: { in: ['BREAKGLASS_REQUESTED', 'BREAKGLASS_DATA_ACCESS', 'BREAKGLASS_REVOKED'] },
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
      ...(doctorId && { actorId: doctorId })
    },
    include: {
      actor: {
        select: { id: true, email: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Usage example in API endpoint:
 * 
 * ```typescript
 * export async function GET(req: NextRequest, { params }: { params: { patientId: string } }) {
 *   const session = await getServerSession(authOptions);
 *   const breakglassToken = req.headers.get('X-Breakglass-Token');
 *   
 *   let doctorId = session?.user?.id;
 *   let breakglassReason = null;
 *   
 *   // Check if using break-glass access
 *   if (breakglassToken) {
 *     const breakglass = await validateBreakglassToken(breakglassToken);
 *     if (!breakglass) {
 *       return new Response('Invalid or expired break-glass token', { status: 401 });
 *     }
 *     doctorId = breakglass.doctorId;
 *     breakglassReason = breakglass.reason;
 *   }
 *   
 *   // Check normal authorization first
 *   if (!breakglassToken && !canAccessPatient(user, patientId)) {
 *     return new Response('Access denied', { status: 403 });
 *   }
 *   
 *   // Fetch patient data
 *   const patient = await prisma.patient.findUnique({
 *     where: { id: patientId },
 *     include: { emrRecords: true, prescriptions: true }
 *   });
 *   
 *   // Log break-glass usage if applicable
 *   if (breakglassToken && breakglassReason) {
 *     await logBreakglassAccess(
 *       breakglassToken,
 *       doctorId,
 *       patientId,
 *       'PatientEMR',
 *       { patientName: `${patient.firstName} ${patient.lastName}` }
 *     );
 *   }
 *   
 *   return Response.json(patient);
 * }
 * ```
 */

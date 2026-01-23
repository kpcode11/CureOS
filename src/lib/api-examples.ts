/**
 * Complete API Integration Examples for RBAC
 * 
 * Real-world examples showing how to implement role-based authorization
 * in actual API endpoints. Copy and adapt these patterns to all endpoints.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  canAccessPatient,
  canEditEMRAssessment,
  canApproveDischargeSummary,
  canViewLabResults,
  canOrderLabTest,
  canDispensePrescription,
  canManageInventory,
  canAccessAuditLogs
} from '@/lib/role-checks';
import {
  requestBreakglassAccess,
  validateBreakglassToken,
  logBreakglassAccess
} from '@/services/breakglass.service';
import { auditLog } from '@/services/audit.service';

// ============================================================================
// EXAMPLE 1: GET /api/patients/:patientId
// Access pattern: ADMIN, DOCTOR, NURSE, PHARMACIST, LAB_TECH, RECEPTIONIST
//                 PATIENT only own record
// ============================================================================

export async function exampleGetPatient(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Step 1: Verify authentication
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Step 2: Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId }
  });

  if (!patient) {
    return Response.json({ error: 'Patient not found' }, { status: 404 });
  }

  // Step 3: Check authorization - can user access this patient?
  const user = session.user;
  if (!canAccessPatient(user, params.patientId, user.patientId)) {
    await auditLog({
      action: 'ACCESS_DENIED',
      resource: 'Patient',
      resourceId: params.patientId,
      actorId: user.id,
      details: { reason: 'Authorization check failed' }
    });
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Step 4: Build role-based SELECT clause (what fields to return)
  let selectClause: any = true; // Default: all fields
  
  if (user.role === 'PATIENT') {
    // Patient sees limited data only
    selectClause = {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      bloodType: true,
      emergencyContact: true
      // Exclude: insurance details, billing
    };
  }

  // Step 5: Execute query with role-based filtering
  const fullPatient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    select: selectClause ? selectClause : undefined,
    include: {
      emrRecords: user.role !== 'PATIENT' ? { take: 5 } : false,
      prescriptions: user.role !== 'PATIENT' ? { take: 5 } : false,
      bedAssignments: user.role === 'RECEPTIONIST' || user.role === 'ADMIN'
    }
  });

  // Step 6: Audit log successful access
  await auditLog({
    action: 'PATIENT_VIEW',
    resource: 'Patient',
    resourceId: params.patientId,
    actorId: user.id,
    details: { role: user.role }
  });

  // Step 7: Return response
  return Response.json(fullPatient);
}

// ============================================================================
// EXAMPLE 2: POST /api/emr/:patientId/discharge-approval
// Access pattern: DOCTOR only (NURSE cannot approve discharge)
// Workflow restriction: Enforce business logic
// ============================================================================

export async function exampleApproveDischarge(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Step 1: Authentication
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const { dischargeNotes, followUpInstructions } = await req.json();

  // Step 2: EXPLICIT WORKFLOW RESTRICTION
  // This is a critical workflow - only DOCTOR can approve discharge
  if (!canApproveDischargeSummary(user)) {
    await auditLog({
      action: 'DISCHARGE_APPROVAL_DENIED',
      resource: 'EMR',
      resourceId: params.patientId,
      actorId: user.id,
      details: { reason: `Role ${user.role} cannot approve discharge` }
    });
    return Response.json(
      { error: 'Only doctors can approve discharge. Nurses: consult your physician.' },
      { status: 403 }
    );
  }

  // Step 3: Verify patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId }
  });

  if (!patient) {
    return Response.json({ error: 'Patient not found' }, { status: 404 });
  }

  // Step 4: Perform discharge approval in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update EMR with discharge notes
    const emr = await tx.eMR.findFirst({
      where: { patientId: params.patientId },
      orderBy: { createdAt: 'desc' }
    });

    if (!emr) {
      throw new Error('No EMR found for patient');
    }

    const updatedEMR = await tx.eMR.update({
      where: { id: emr.id },
      data: {
        dischargeSummary: dischargeNotes,
        followUpInstructions,
        dischargedAt: new Date(),
        dischargedBy: user.id
      }
    });

    return updatedEMR;
  }, { timeout: 10000 });

  // Step 5: Audit log the discharge approval
  await auditLog({
    action: 'DISCHARGE_APPROVED',
    resource: 'EMR',
    resourceId: result.id,
    actorId: user.id,
    details: {
      patientId: params.patientId,
      timestamp: new Date()
    }
  });

  // Step 6: Return success
  return Response.json({
    success: true,
    emrId: result.id,
    message: 'Patient discharge approved and documented'
  });
}

// ============================================================================
// EXAMPLE 3: GET /api/emr/:patientId
// Access pattern: DOCTOR, NURSE (read-only), ADMIN
//                 NOT PHARMACIST
//                 PATIENT only own
// ============================================================================

export async function exampleGetEMR(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Step 1: Authentication
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const breakglassToken = req.headers.get('X-Breakglass-Token');

  let doctorId = user.id;
  let breakglassReason = null;

  // Step 2A: Check normal authorization
  if (!canAccessPatient(user, params.patientId, user.patientId)) {
    // Step 2B: Check break-glass access (doctor emergency override)
    if (breakglassToken) {
      const breakglass = await validateBreakglassToken(breakglassToken);
      if (!breakglass) {
        return Response.json(
          { error: 'Invalid or expired break-glass token' },
          { status: 401 }
        );
      }
      doctorId = breakglass.doctorId;
      breakglassReason = breakglass.reason;
    } else {
      // Access denied - no normal auth and no valid break-glass
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  // Step 3: Explicitly block PHARMACIST (not just missing permission)
  if (user.role === 'PHARMACIST') {
    return Response.json(
      { error: 'Pharmacists cannot access clinical records' },
      { status: 403 }
    );
  }

  // Step 4: Fetch EMR records
  const emrRecords = await prisma.eMR.findMany({
    where: { patientId: params.patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: {
        select: { id: true, name: true }
      },
      patient: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  // Step 5: Filter response based on role (NURSE sees read-only)
  const responseData = emrRecords.map(emr => ({
    ...emr,
    // NURSE cannot see sensitivity-marked fields
    ...(user.role === 'NURSE' && {
      assessmentNotes: emr.assessmentNotes ? '[Redacted for NURSE role]' : null,
      internalNotes: null // NURSE doesn't see internal notes
    })
  }));

  // Step 6: Log break-glass usage if applicable
  if (breakglassToken && breakglassReason) {
    await logBreakglassAccess(
      breakglassToken,
      doctorId,
      params.patientId,
      'EMR_RECORDS',
      { recordCount: responseData.length }
    );
  }

  // Step 7: Audit normal access
  if (!breakglassToken) {
    await auditLog({
      action: 'EMR_VIEW',
      resource: 'EMR',
      resourceId: params.patientId,
      actorId: user.id,
      details: { role: user.role, recordCount: responseData.length }
    });
  }

  return Response.json(responseData);
}

// ============================================================================
// EXAMPLE 4: GET /api/lab-results/:patientId
// Access pattern: DOCTOR, NURSE, LAB_TECH, PATIENT (own)
//                 NOT PHARMACIST, NOT BILLING_OFFICER
// ============================================================================

export async function exampleGetLabResults(
  req: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;

  // Step 1: Explicit deny for roles that should NOT access lab data
  if (!canViewLabResults(user)) {
    await auditLog({
      action: 'LAB_ACCESS_DENIED',
      resource: 'LabTest',
      resourceId: params.patientId,
      actorId: user.id,
      details: { reason: `Role ${user.role} cannot access lab results` }
    });
    return Response.json(
      { error: 'Lab results are restricted from your role' },
      { status: 403 }
    );
  }

  // Step 2: Check patient access
  if (!canAccessPatient(user, params.patientId, user.patientId)) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Step 3: Build role-specific WHERE clause
  let where = { patientId: params.patientId };
  if (user.role === 'PATIENT') {
    // PATIENT sees only own results
    where = { patientId: params.patientId, patient: { id: user.patientId } };
  }

  // Step 4: Fetch with role-based SELECT
  let select: any = true;
  if (user.role === 'LAB_TECH') {
    // Lab tech sees all fields including sample handling
    select = true;
  } else if (user.role === 'PATIENT') {
    // Patient sees results only, no internal lab notes
    select = {
      id: true,
      testName: true,
      result: true,
      normalRange: true,
      createdAt: true,
      status: true
      // Exclude: internalNotes, labNotes
    };
  }

  const results = await prisma.labTest.findMany({
    where,
    select: select ? select : undefined,
    orderBy: { createdAt: 'desc' }
  });

  // Step 5: Audit
  await auditLog({
    action: 'LAB_RESULTS_VIEW',
    resource: 'LabTest',
    resourceId: params.patientId,
    actorId: user.id,
    details: { role: user.role, resultCount: results.length }
  });

  return Response.json(results);
}

// ============================================================================
// EXAMPLE 5: POST /api/prescriptions/:id/dispense
// Access pattern: PHARMACIST only
// Workflow: Validate prescription exists and is approved
// ============================================================================

export async function exampleDispensePrescription(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const { quantity, notes } = await req.json();

  // Step 1: Role-based access
  if (!canDispensePrescription(user)) {
    await auditLog({
      action: 'DISPENSING_DENIED',
      resource: 'Prescription',
      resourceId: params.id,
      actorId: user.id,
      details: { reason: 'Only pharmacists can dispense' }
    });
    return Response.json(
      { error: 'Only pharmacists can dispense medications' },
      { status: 403 }
    );
  }

  // Step 2: Verify prescription exists and is approvable
  const prescription = await prisma.prescription.findUnique({
    where: { id: params.id },
    include: { patient: true, drug: true }
  });

  if (!prescription) {
    return Response.json({ error: 'Prescription not found' }, { status: 404 });
  }

  if (prescription.status !== 'APPROVED') {
    return Response.json(
      { error: 'Prescription must be approved before dispensing' },
      { status: 400 }
    );
  }

  // Step 3: Check inventory
  if (!prescription.drug) {
    return Response.json({ error: 'Drug not found' }, { status: 404 });
  }

  if (prescription.drug.availableQuantity < quantity) {
    return Response.json(
      { error: 'Insufficient inventory' },
      { status: 400 }
    );
  }

  // Step 4: Execute dispensing in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update prescription
    const updated = await tx.prescription.update({
      where: { id: params.id },
      data: {
        status: 'DISPENSED',
        dispensedAt: new Date(),
        dispensedBy: user.id,
        dispensedQuantity: quantity,
        dispensingNotes: notes
      }
    });

    // Decrement inventory
    await tx.drug.update({
      where: { id: prescription.drug!.id },
      data: {
        availableQuantity: {
          decrement: quantity
        }
      }
    });

    return updated;
  });

  // Step 5: Audit
  await auditLog({
    action: 'PRESCRIPTION_DISPENSED',
    resource: 'Prescription',
    resourceId: result.id,
    actorId: user.id,
    details: {
      patientId: result.patientId,
      quantity,
      drug: prescription.drug.name
    }
  });

  return Response.json({
    success: true,
    prescription: result,
    message: `Dispensed ${quantity} of ${prescription.drug.name}`
  });
}

// ============================================================================
// EXAMPLE 6: POST /api/breakglass/request
// Access pattern: DOCTOR only
// Emergency access: Create emergency token for out-of-auth access
// ============================================================================

export async function exampleRequestBreakglass(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const { patientId, reason } = await req.json();

  // Step 1: Only DOCTOR can request break-glass
  if (user.role !== 'DOCTOR' && user.role !== 'ADMIN') {
    await auditLog({
      action: 'BREAKGLASS_REQUEST_DENIED',
      resource: 'Patient',
      resourceId: patientId,
      actorId: user.id,
      details: { reason: 'Only doctors can request break-glass' }
    });
    return Response.json(
      { error: 'Only doctors can request emergency access' },
      { status: 403 }
    );
  }

  // Step 2: Validate reason is provided
  if (!reason || reason.length < 10) {
    return Response.json(
      { error: 'Emergency reason required (minimum 10 characters)' },
      { status: 400 }
    );
  }

  // Step 3: Request break-glass token
  try {
    const breakglass = await requestBreakglassAccess({
      doctorId: user.id,
      patientId,
      reason
    });

    // Step 4: Log in audit
    await auditLog({
      action: 'BREAKGLASS_TOKEN_GENERATED',
      resource: 'Patient',
      resourceId: patientId,
      actorId: user.id,
      details: { reason, expiresAt: breakglass.expiresAt }
    });

    // Step 5: Return token (15-minute window)
    return Response.json({
      success: true,
      token: breakglass.token,
      expiresAt: breakglass.expiresAt,
      message: `Emergency access token valid for 15 minutes. Reason: ${reason}`
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// ============================================================================
// EXAMPLE 7: GET /api/audit-logs
// Access pattern: ADMINISTRATOR only
// Security: Sensitive - only admin can audit compliance
// ============================================================================

export async function exampleGetAuditLogs(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;

  // Step 1: Strict access control - ADMIN ONLY
  if (!canAccessAuditLogs(user)) {
    // Log the unauthorized access attempt
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'AUDIT_ACCESS_DENIED',
        resource: 'AuditLog',
        details: { reason: 'Unauthorized audit log access attempt' }
      }
    });
    return Response.json(
      { error: 'Audit logs are restricted to administrators' },
      { status: 403 }
    );
  }

  // Step 2: Parse query parameters
  const { startDate, endDate, actorId, action } = Object.fromEntries(
    new URL(req.url).searchParams
  );

  // Step 3: Build where clause
  const where: any = {};
  if (startDate) where.createdAt = { gte: new Date(startDate as string) };
  if (endDate) where.createdAt = { lte: new Date(endDate as string) };
  if (actorId) where.actorId = actorId;
  if (action) where.action = action;

  // Step 4: Fetch audit logs
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: {
        select: { id: true, email: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  // Step 5: Audit the audit access (meta-auditing)
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: 'AUDIT_LOGS_VIEWED',
      resource: 'AuditLog',
      details: { filterCount: logs.length }
    }
  });

  return Response.json(logs);
}

/**
 * Implementation Checklist Summary:
 * 
 * For each API endpoint:
 * ✓ 1. Get session from NextAuth
 * ✓ 2. Verify user is authenticated
 * ✓ 3. Extract role from session
 * ✓ 4. Check explicit role restrictions (PHARMACIST can't access EMR, etc.)
 * ✓ 5. Check role-based access to resource (patient, record, etc.)
 * ✓ 6. Build WHERE/SELECT clauses for role-based filtering
 * ✓ 7. Execute query with filters
 * ✓ 8. Log access in audit trail
 * ✓ 9. Return filtered response
 * ✓ 10. Handle break-glass tokens if applicable
 * 
 * Defense in depth:
 * - Middleware layer (token validation)
 * - Endpoint layer (role checks)
 * - Query layer (data filtering)
 * - Audit layer (logging everything)
 */

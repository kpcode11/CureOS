/**
 * API-level role-based authorization enforcement
 * 
 * Add these checks at the start of each API endpoint to enforce
 * role-based access control and data filtering
 * 
 * Pattern:
 * 1. Get user from session
 * 2. Call checkPermission() - enforces middleware auth + permission check
 * 3. Build role-specific WHERE clauses
 * 4. Apply WHERE clause to queries
 * 5. Return filtered data
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Example: GET /api/patients
 * 
 * Access control:
 * - ADMIN, DOCTOR, NURSE, PHARMACIST, LAB_TECH, BILLING_OFFICER: All patients
 * - RECEPTIONIST: All patients (for registration/scheduling)
 * - PATIENT: Only own records
 */
export async function exampleGetPatients(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role; // From JWT token populated in auth.ts

  // Build WHERE clause based on role
  let whereClause = {};
  if (role === 'PATIENT') {
    // Only own records - would need to check if patient or if user has associated patient
    whereClause = { /* filter logic */ };
  }
  // Other roles can see all patients

  const patients = await prisma.patient.findMany({
    where: whereClause,
    include: { emrRecords: true, prescriptions: true }
  });

  return Response.json(patients);
}

/**
 * Example: GET /api/emr
 * 
 * Access control:
 * - DOCTOR, NURSE: All EMR records (read-only for nurse)
 * - PHARMACIST: Cannot access EMR
 * - PATIENT: Only own EMR
 * - ADMIN: All
 */
export async function exampleGetEMRRecords(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  // Explicitly block PHARMACIST from viewing EMR
  if (role === 'PHARMACIST') {
    return new Response('Pharmacist cannot access clinical records', { status: 403 });
  }

  let whereClause = {};
  if (role === 'PATIENT') {
    // Only own EMR records
    whereClause = { patient: { /* match current patient */ } };
  }

  const emrRecords = await prisma.eMR.findMany({
    where: whereClause,
    include: { patient: true, doctor: true }
  });

  return Response.json(emrRecords);
}

/**
 * Example: POST /api/emr/:patientId/discharge-approval
 * 
 * Workflow restriction:
 * - Only DOCTOR can approve discharge (not NURSE)
 */
export async function exampleApproveDischarge(req: NextRequest, { params }: { params: { patientId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  // Explicit workflow restriction
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return new Response('Only doctors can approve discharge', { status: 403 });
  }

  // Process discharge approval...
  return Response.json({ success: true });
}

/**
 * Example: GET /api/lab-results
 * 
 * Access control:
 * - DOCTOR, NURSE, LAB_TECH, PATIENT: Can view
 * - PHARMACIST: Explicitly blocked
 * - BILLING_OFFICER: Blocked
 */
export async function exampleGetLabResults(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  // Explicitly block roles from viewing lab data
  if (['PHARMACIST', 'BILLING_OFFICER'].includes(role)) {
    return new Response('Access denied to lab results', { status: 403 });
  }

  let whereClause = {};
  if (role === 'PATIENT') {
    whereClause = { patient: { /* match current patient */ } };
  }

  const results = await prisma.labTest.findMany({
    where: whereClause,
    include: { patient: true, labTech: true }
  });

  return Response.json(results);
}

/**
 * Example: POST /api/prescriptions/:id/dispense
 * 
 * Only PHARMACIST can dispense
 */
export async function exampleDispensePrescription(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  if (role !== 'PHARMACIST' && role !== 'ADMIN') {
    return new Response('Only pharmacists can dispense medications', { status: 403 });
  }

  // Process dispensing...
  return Response.json({ success: true });
}

/**
 * Example: PUT /api/inventory
 * 
 * Only PHARMACIST can manage inventory
 */
export async function exampleUpdateInventory(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  if (role !== 'PHARMACIST' && role !== 'ADMIN') {
    return new Response('Only pharmacists can manage inventory', { status: 403 });
  }

  // Process inventory update...
  return Response.json({ success: true });
}

/**
 * Example: GET /api/billing
 * 
 * Access control:
 * - BILLING_OFFICER: See invoices only (limited data)
 * - ADMIN: Full access
 * - PATIENT: Own billing only
 * - Others: Blocked
 */
export async function exampleGetBilling(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  if (!['ADMIN', 'BILLING_OFFICER', 'PATIENT', 'DOCTOR'].includes(role)) {
    return new Response('Access denied', { status: 403 });
  }

  let whereClause = {};
  let selectClause: any = true;

  if (role === 'BILLING_OFFICER') {
    // Only see service descriptions, not clinical details
    selectClause = {
      id: true,
      amount: true,
      status: true,
      serviceDescription: true,
      createdAt: true
      // Exclude clinical data
    };
  }

  if (role === 'PATIENT') {
    whereClause = { patient: { /* current patient */ } };
  }

  const billing = await prisma.billing.findMany({
    where: whereClause,
    select: selectClause
  });

  return Response.json(billing);
}

/**
 * Example: GET /api/audit-logs
 * 
 * Only ADMIN can access audit logs
 */
export async function exampleGetAuditLogs(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = session.user;
  const role = user.role;

  if (role !== 'ADMIN') {
    return new Response('Audit logs are for administrators only', { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return Response.json(logs);
}

/**
 * Implementation checklist for each API endpoint:
 * 
 * ✓ 1. Get session and verify authentication
 * ✓ 2. Extract role from user/JWT
 * ✓ 3. Check if role is allowed for endpoint (explicit allow/deny)
 * ✓ 4. Build WHERE clauses for role-based filtering
 * ✓ 5. Apply SELECT clause to hide sensitive fields from certain roles
 * ✓ 6. Execute query with filters
 * ✓ 7. Log access in audit trail (optional)
 * ✓ 8. Return filtered/limited data
 * 
 * Apply this pattern across all patient data, EMR, prescription, lab, surgery, and billing endpoints.
 */

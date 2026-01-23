# Comprehensive Hospital RBAC Implementation

## Overview

Complete role-based access control (RBAC) system for CureOS hospital management platform with 8 roles and 57+ granular permissions across 22 hospital modules.

## 8 Core Roles

### 1. **ADMINISTRATOR** (20 permissions)
**Purpose**: Full system access, user management, configuration, audit logging
**Can perform**:
- User CRUD operations
- Role and permission management
- System configuration
- Access all data across hospital
- View complete audit logs
- Override security restrictions

**Cannot**: None - unrestricted access

**Permissions**:
```
admin.users.create       - Create new users
admin.users.read         - View user list and details
admin.users.update       - Modify user information
admin.users.delete       - Delete users (with safeguards)
admin.roles.manage       - Create, update, delete roles
admin.permissions.manage - Create, update, delete permissions
admin.config.manage      - System configuration
audit.logs.read          - View audit logs
audit.logs.export        - Export audit trail
patient.read             - View all patient records
emr.read                 - View all EMR
prescription.read        - View all prescriptions
lab.order.read           - View lab orders
lab.result.read          - View lab results
billing.invoice.read     - View billing
nursing.orders.read      - View nursing orders
surgery.schedule.read    - View surgeries
beds.status.read         - View bed status
beds.assign.manage       - Manage bed assignments
inventory.view           - View inventory
```

### 2. **RECEPTIONIST** (7 permissions)
**Purpose**: Patient registration, appointment scheduling, bed management

**Can perform**:
- Register new patients
- Manage appointments
- Check bed availability and assign beds
- View patient status for registration purposes

**Cannot**: 
- View clinical data (EMR, lab results, prescriptions)
- Manage inventory or pharmacy
- Create prescriptions
- Access administrative functions

**Permissions**:
```
patient.create           - Register new patients
patient.read             - View patient information
patient.update           - Update patient demographics
patient.history.read     - View patient history
beds.status.read         - Check available beds
beds.assign.manage       - Assign patients to beds
admin.permissions.manage - Limited self-serve
```

### 3. **DOCTOR** (21 permissions)
**Purpose**: Patient care, EMR, clinical orders, prescriptions, surgery scheduling
**Break-glass emergency access** ✓

**Can perform**:
- Create and update EMR (full clinical documentation)
- Diagnose and assess patients
- Approve discharge summaries
- Prescribe medications
- Order lab and radiology tests
- Schedule surgery
- Request break-glass emergency access to records outside normal authorization

**Cannot**:
- Approve prescriptions (they create them)
- Dispense medications (pharmacist does)
- Manage pharmacy inventory
- Access billing/financial data
- Manage user accounts
- Approve discharges without proper EMR assessment

**Permissions**:
```
patient.read             - View patient information
emr.create               - Create EMR entries
emr.read                 - View EMR records
emr.update               - Modify EMR
emr.assess               - Document assessments
emr.diagnose             - Record diagnosis
emr.discharge.approve    - Approve discharge summaries
emr.history.read         - View EMR history
prescription.create      - Create prescriptions
prescription.read        - View prescriptions
prescription.approve     - Approve prescription orders
lab.order.create         - Order lab tests
lab.order.read           - View lab orders
lab.result.read          - View lab results
surgery.schedule.create  - Schedule surgery
surgery.schedule.read    - View surgery schedule
surgery.schedule.update  - Update surgery details
surgery.notes.read       - View surgery notes
emergency.access.breakglass - Request emergency access
emergency.alerts.view    - View emergency alerts
```

### 4. **NURSE** (10 permissions)
**Purpose**: Patient monitoring, vital signs, medication administration, assessments
**Read-only**: For orders, prescriptions, EMR

**Can perform**:
- Record vital signs
- Manage medication administration records (MAR)
- Record intake and output
- Write nursing notes and assessments
- View orders and prescriptions (read-only)
- View EMR for context

**Cannot**:
- Approve discharge (only doctor)
- Write diagnoses
- Order lab tests or medications
- Dispense medications
- Create or modify prescriptions
- Access pharmacy inventory
- Access financial/billing data

**Permissions**:
```
patient.read             - View patient information
patient.read.own         - View assigned patients
emr.read                 - View EMR (read-only)
emr.history.read         - View EMR history
prescription.read        - View prescriptions (read-only)
nursing.vitals.record    - Record vital signs (temperature, BP, etc.)
nursing.mar.manage       - Manage medication administration records
nursing.intake.output.record - Record fluid intake/output
nursing.orders.read      - View orders
nursing.notes.write      - Write nursing notes/assessments
```

### 5. **PHARMACIST** (8 permissions)
**Purpose**: Medication dispensing, inventory management, drug interactions
**Cannot access**: EMR, lab results, surgery details, clinical data

**Can perform**:
- View and dispense prescriptions
- Manage drug inventory and stock levels
- Monitor expiration dates
- Check drug interactions
- Manage pharmaceutical ordering

**Cannot**:
- View clinical data (EMR, diagnoses, assessments)
- View lab results
- Access surgery information
- Create prescriptions
- Order lab tests
- View patient history beyond what's necessary for dispensing

**Permissions**:
```
patient.read             - View patient info (for dispensing only)
prescription.read        - View prescriptions
prescription.dispense    - Dispense medications
pharmacy.drug.read       - Access drug database
pharmacy.inventory.manage - Manage inventory
pharmacy.stock.manage    - Manage stock levels
pharmacy.dispensing.process - Process dispensing
pharmacy.expiry.monitor  - Monitor expirations
```

### 6. **LAB_TECH** (6 permissions)
**Purpose**: Lab test processing, sample handling, result data entry
**Data entry only**: Cannot order new tests

**Can perform**:
- View and track lab orders
- Record sample details and tracking
- Enter lab test results
- Upload lab reports
- View results (for quality control)

**Cannot**:
- Order new lab tests (doctor does)
- Interpret results (doctor interprets)
- Modify already-entered results (immutable for audit)
- Access patient EMR
- Access medication/pharmacy data

**Permissions**:
```
patient.read             - View patient info
lab.order.read           - View lab orders
lab.sample.track         - Track sample status
lab.result.enter         - Enter test results
lab.result.read          - View results
lab.report.upload        - Upload reports
```

### 7. **BILLING_OFFICER** (6 permissions)
**Purpose**: Invoice generation, claims management, discount approvals
**Limited view**: Service descriptions only, no clinical data

**Can perform**:
- Create and manage invoices
- Process insurance claims
- Approve discounts/adjustments
- View patient billing information (limited)
- Export billing reports

**Cannot**:
- View clinical data (EMR, diagnoses, treatments)
- View lab results
- View prescription details
- Access pharmacy data
- Modify patient medical records
- Create discount codes without audit trail

**Permissions**:
```
patient.read             - View patient info (limited)
billing.invoice.create   - Create invoices
billing.invoice.read     - View invoices
billing.claim.manage     - Manage insurance claims
billing.discount.approve - Approve discounts
audit.logs.read          - View audit logs (for compliance)
```

### 8. **PATIENT** (3 permissions)
**Purpose**: Patient portal access, read-only own records
**Strict filtering**: Only own records

**Can perform**:
- View own medical records
- View own prescriptions
- View own test results
- Access appointment history

**Cannot**:
- View other patients' data
- Modify any medical records
- Order tests or medications
- Access staff functions
- View billing details
- Schedule appointments (receptionist does)

**Permissions**:
```
patient.read.own         - View own patient record
emr.read.own             - View own EMR
prescription.read.own    - View own prescriptions
```

---

## Permission Categories (57 Total)

### Admin Module (7 permissions)
- `admin.users.create` - Create user accounts
- `admin.users.read` - View user list
- `admin.users.update` - Modify user details
- `admin.users.delete` - Delete user accounts
- `admin.roles.manage` - Manage roles
- `admin.permissions.manage` - Manage permissions
- `admin.config.manage` - System configuration

### Audit Module (2 permissions)
- `audit.logs.read` - View audit trail
- `audit.logs.export` - Export logs

### Patient Module (6 permissions)
- `patient.create` - Register new patient
- `patient.read` - View any patient
- `patient.read.own` - View own record
- `patient.update` - Modify patient data
- `patient.delete` - Delete patient (admin only)
- `patient.history.read` - View patient history

### EMR Module (8 permissions)
- `emr.create` - Create EMR entry
- `emr.read` - View any EMR
- `emr.read.own` - View own EMR
- `emr.update` - Modify EMR
- `emr.assess` - Document assessments
- `emr.diagnose` - Record diagnosis
- `emr.discharge.approve` - Approve discharge
- `emr.history.read` - View EMR history

### Prescription Module (5 permissions)
- `prescription.create` - Create prescription
- `prescription.read` - View prescriptions
- `prescription.read.own` - View own prescriptions
- `prescription.dispense` - Dispense medication
- `prescription.approve` - Approve prescription

### Lab Module (6 permissions)
- `lab.order.create` - Order lab test
- `lab.order.read` - View orders
- `lab.sample.track` - Track sample
- `lab.result.enter` - Enter results
- `lab.result.read` - View results
- `lab.report.upload` - Upload reports

### Pharmacy Module (5 permissions)
- `pharmacy.drug.read` - View drug database
- `pharmacy.inventory.manage` - Manage inventory
- `pharmacy.stock.manage` - Manage stock
- `pharmacy.dispensing.process` - Process dispensing
- `pharmacy.expiry.monitor` - Monitor expirations

### Nursing Module (5 permissions)
- `nursing.vitals.record` - Record vital signs
- `nursing.mar.manage` - Manage MAR
- `nursing.intake.output.record` - Record I/O
- `nursing.orders.read` - View orders
- `nursing.notes.write` - Write notes

### Surgery Module (4 permissions)
- `surgery.schedule.create` - Schedule surgery
- `surgery.schedule.read` - View schedule
- `surgery.schedule.update` - Update schedule
- `surgery.notes.read` - View surgery notes

### Billing Module (4 permissions)
- `billing.invoice.create` - Create invoice
- `billing.invoice.read` - View invoices
- `billing.claim.manage` - Manage claims
- `billing.discount.approve` - Approve discounts

### Beds/Inventory Module (3 permissions)
- `beds.status.read` - View bed status
- `beds.assign.manage` - Manage assignments
- `inventory.view` - View inventory

### Emergency Module (2 permissions)
- `emergency.access.breakglass` - Request emergency access
- `emergency.alerts.view` - View alerts

---

## Implementation Architecture

### 1. **Database Layer** (Prisma)
```
RoleEntity (8 roles)
  ↓ ← → Permission (57 permissions)
  └─→ RolePermission (junction table)

User
  ├─→ roleEntityId (which role assigned)
  └─→ role (legacy enum field)
```

### 2. **Authentication** (NextAuth + JWT)
- Session includes: `user.role` (enum value)
- JWT token includes: `role` claim
- Middleware validates token on protected routes

### 3. **Authorization Layers** (Defense in Depth)

#### Layer 1: Middleware (`src/middleware.ts`)
- Route protection: `/admin`, `/api/*`
- Token validation
- Basic permission checks for protected endpoints

#### Layer 2: API Endpoints (`src/app/api/**`)
- Role-based access checks
- Data filtering by role
- Explicit workflow restrictions
- Audit logging on access

#### Layer 3: Services (`src/services/**`)
- Business logic constraints
- Additional role validations
- Data transformation based on role

#### Layer 4: Helper Functions (`src/lib/role-checks.ts`)
- Reusable permission checks
- Centralized authorization logic
- Easy to test and maintain

---

## Security Features

### 1. **Role-Based Data Filtering**
```typescript
// Example: Only PATIENT can see own records
let WHERE = {};
if (user.role === 'PATIENT') {
  WHERE = { patientId: user.id };
}
const records = await prisma.emr.findMany({ where: WHERE });
```

### 2. **Workflow Restrictions**
Enforce business logic boundaries:
- NURSE cannot approve discharge (only DOCTOR)
- PHARMACIST cannot see clinical EMR data
- BILLING_OFFICER sees service descriptions only (no clinical details)

```typescript
if (user.role === 'NURSE' && action === 'approve_discharge') {
  return Response.json({ error: 'Only doctors can approve discharge' }, { status: 403 });
}
```

### 3. **Break-Glass Emergency Access**
Doctors can request temporary access outside normal authorization:
```typescript
// Request emergency access
const token = await requestBreakglassAccess({
  doctorId: user.id,
  patientId: emergencyPatient.id,
  reason: 'Unconscious patient, emergency intake'
});

// Use token in API request
const data = await fetch('/api/patients/123', {
  headers: { 'X-Breakglass-Token': token.token }
});

// Full audit trail created automatically
```

### 4. **Audit Logging**
Every access logged with:
- Who (user ID, role)
- What (resource type, record ID)
- When (timestamp)
- Why (action, reason)
- How (normal auth or break-glass)

```typescript
await auditLog({
  action: 'BREAKGLASS_DATA_ACCESS',
  resource: 'EMR',
  resourceId: patientId,
  reason: 'Emergency intake',
  timestamp: new Date()
});
```

### 5. **Case-Insensitive Role/Permission Checks**
Database indexes ensure consistent lookups:
```sql
CREATE INDEX "RoleEntity_lower_name" ON "RoleEntity"(LOWER(name));
CREATE INDEX "Permission_lower_name" ON "Permission"(LOWER(name));
```

### 6. **Admin Self-Protection**
Prevent accidental system lockout:
- Cannot delete last administrator
- Cannot remove own ADMINISTRATOR role
- Cannot change own role to non-admin

---

## API Implementation Checklist

For each API endpoint, implement in this order:

### ✓ Step 1: Authentication
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
```

### ✓ Step 2: Authorization
```typescript
const role = session.user.role;
if (!ALLOWED_ROLES.includes(role)) {
  return Response.json({ error: 'Access denied' }, { status: 403 });
}
```

### ✓ Step 3: Role-Based Filtering
```typescript
let where = {};
if (role === 'PATIENT') {
  where = { patientId: session.user.id };
}
```

### ✓ Step 4: Execute Query
```typescript
const data = await prisma.model.findMany({ where, select });
```

### ✓ Step 5: Audit Log
```typescript
await logAccess(session.user.id, 'DATA_ACCESS', 'Model', data.id);
```

### ✓ Step 6: Return Data
```typescript
return Response.json(data);
```

---

## Role-Check Helper Functions

Located in `src/lib/role-checks.ts`:

```typescript
// Permission checks
hasPermission(user, 'emr.diagnose')
canAccessPatient(user, patientId)
canViewEMR(user)
canEditEMRAssessment(user)
canApproveDischargeSummary(user)

// Prescription checks
canViewPrescriptions(user)
canDispensePrescription(user)

// Lab checks
canViewLabResults(user)
canOrderLabTest(user)
canEnterLabResults(user)

// Workflow restrictions
canApproveDischargeSummary(user) // ← Doctor only
canDispensePrescription(user) // ← Pharmacist only
canManageInventory(user) // ← Pharmacist only
canAccessAuditLogs(user) // ← Admin only

// Emergency access
canRequestBreakglassAccess(user)
```

---

## Configuration Files

### `prisma/seed-rbac.ts`
Creates all 8 roles and 57 permissions on database init.
Run: `npm run prisma:seed`

### `src/lib/auth.ts`
NextAuth configuration with JWT payload including `role`.

### `src/middleware.ts`
Route protection for `/admin` and protected API endpoints.

### `.env`
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
RBAC_ADMIN_EMAIL=admin@neon.example
RBAC_ADMIN_PASSWORD=Admin123!
```

---

## Testing RBAC System

### Login as different roles:
```
Admin: admin@neon.example / Admin123!

# Create test users for other roles:
Doctor: doctor@example.com / Password123!
Nurse: nurse@example.com / Password123!
Pharmacist: pharmacist@example.com / Password123!
```

### Test workflows:
1. **Doctor can approve discharge**: ✓
2. **Nurse cannot approve discharge**: ✗ (403)
3. **Pharmacist cannot view EMR**: ✗ (403)
4. **Billing Officer sees limited invoice data**: ✓
5. **Patient only sees own records**: ✓
6. **Break-glass access creates audit log**: ✓

---

## Future Enhancements

- [ ] Dynamic role creation in UI
- [ ] Fine-grained permission assignment in UI
- [ ] Role-based API rate limiting
- [ ] Time-based access restrictions (shifts)
- [ ] Location-based access control (department)
- [ ] Approval workflows for sensitive operations
- [ ] Time-lock on sensitive actions (2-person rule)
- [ ] Graphical audit trail visualization
- [ ] Real-time permission change notifications
- [ ] Role delegation (temporary) system

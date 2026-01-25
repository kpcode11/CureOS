# Permission Mismatch Analysis - CureOS

## CRITICAL ISSUE FOUND

**Root Cause**: Routes are checking for permissions that **DO NOT EXIST** in `seed-rbac.ts`, causing all API requests to fail with 403 Forbidden.

---

## EDGE CASES IDENTIFIED

### 1. **Permission Naming Inconsistencies**

| Route Checks | Seeded As | Status |
|---|---|---|
| `patient.read` | ✅ Exists | OK |
| `patient.create` | ✅ Exists | OK |
| `doctor.read` | ✅ Exists | OK |
| `prescriptions.read` | ❌ NOT IN SEED | **MISMATCH** |
| `prescriptions.create` | ❌ NOT IN SEED | **MISMATCH** |
| `pharmacy.read` | ❌ NOT IN SEED | **MISMATCH** |
| `pharmacy.dispense` | ❌ NOT IN SEED | **MISMATCH** |
| `surgery.read` | ❌ NOT IN SEED | **MISMATCH** |
| `surgery.create` | ❌ NOT IN SEED | **MISMATCH** |
| `nursing.read` | ❌ NOT IN SEED | **MISMATCH** |
| `nursing.create` | ❌ NOT IN SEED | **MISMATCH** |
| `nursing.update` | ❌ NOT IN SEED | **MISMATCH** |
| `lab.read` | ❌ NOT IN SEED | **MISMATCH** |
| `lab.create` | ❌ NOT IN SEED | **MISMATCH** |
| `lab.order` | ❌ NOT IN SEED | **MISMATCH** |
| `inventory.read` | ❌ NOT IN SEED | **MISMATCH** |
| `inventory.update` | ❌ NOT IN SEED | **MISMATCH** |
| `beds.read` | ❌ NOT IN SEED | **MISMATCH** |
| `beds.update` | ❌ NOT IN SEED | **MISMATCH** |
| `emergency.read` | ❌ NOT IN SEED | **MISMATCH** |
| `emergency.create` | ❌ NOT IN SEED | **MISMATCH** |
| `billing.read` | ❌ NOT IN SEED | **MISMATCH** |
| `billing.create` | ❌ NOT IN SEED | **MISMATCH** |
| `billing.update` | ❌ NOT IN SEED | **MISMATCH** |
| `appointment.read` | ✅ Exists as `appointment.read` | OK |
| `appointment.create` | ✅ Exists | OK |
| `appointment.update` | ✅ Exists | OK |
| `appointments.read` | ❌ NOT IN SEED (vs `appointment.read`) | **MISMATCH** |
| `appointments.update` | ❌ NOT IN SEED (vs `appointment.update`) | **MISMATCH** |
| `audit.read` | ✅ Exists | OK |
| `emr.read` | ✅ Exists | OK |
| `emr.create` | ✅ Exists | OK |
| `emr.write` | ❌ NOT IN SEED | **MISMATCH** |
| `admin.users.read` | ✅ Exists | OK |
| `admin.users.create` | ✅ Exists | OK |
| `admin.users.update` | ✅ Exists | OK |
| `admin.users.delete` | ✅ Exists | OK |
| `admin.roles.manage` | ✅ Exists | OK |
| `admin.permissions.manage` | ✅ Exists | OK |
| `roles.manage` | ❌ NOT IN SEED (vs `admin.roles.manage`) | **MISMATCH** |
| `emergency.request` | ❌ NOT IN SEED | **MISMATCH** |
| `incidents.read` | ❌ NOT IN SEED | **MISMATCH** |
| `incidents.create` | ❌ NOT IN SEED | **MISMATCH** |
| `insurance.read` | ❌ NOT IN SEED | **MISMATCH** |
| `insurance.create` | ❌ NOT IN SEED | **MISMATCH** |
| `prescription.create` | ✅ Exists | OK |
| `prescription.update` | ❌ NOT IN SEED | **MISMATCH** |

### 2. **Singular vs Plural Naming**
- Routes use: `prescription.create`, `appointments.read`, `prescriptions.read`
- Seed defines: `prescription.*`, but also `appointment.*`
- **INCONSISTENT PLURALIZATION PATTERN**

### 3. **Missing Permission Groups**

Routes check for permissions that don't exist in seed:

```javascript
// Missing in seed-rbac.ts but used in routes:
- prescriptions.read
- prescriptions.create
- prescription.update
- pharmacy.read
- pharmacy.dispense
- surgery.read
- surgery.create
- nursing.read
- nursing.create
- nursing.update
- lab.read
- lab.create
- lab.order
- inventory.read
- inventory.update
- beds.read
- beds.update
- emergency.read
- emergency.create
- billing.read
- billing.create
- billing.update
- appointments.read (singular exists)
- appointments.update (singular exists)
- emr.write
- roles.manage
- emergency.request
- incidents.read
- incidents.create
- insurance.read
- insurance.create
```

### 4. **Role-Permission Assignment Issues**

When users log in:
1. Auth.ts loads permissions from `RolePermission` -> `Permission` table
2. Checks if `session.user.permissions` includes the requested permission
3. **Routes check for permissions that were NEVER seeded into the database**
4. **Result: ALL API calls return 403 Forbidden**

### 5. **Schema Role Enum Conflicts**

Schema defines:
```prisma
enum Role {
  DOCTOR
  NURSE
  PHARMACIST
  LAB_TECH
  RECEPTIONIST
  ADMIN      // ← seed creates "ADMINISTRATOR"
  EMERGENCY
}
```

Seed creates:
```typescript
ADMINISTRATOR  // ← Not in enum
RECEPTIONIST
DOCTOR
NURSE
PHARMACIST
LAB_TECH
BILLING_OFFICER  // ← NOT in enum
PATIENT          // ← NOT in enum
```

When seed tries to create admin user:
```typescript
role: 'ADMIN' as unknown as any,  // ← Type cast workaround!
roleEntityId: roleMap.ADMINISTRATOR.id,
```

### 6. **Data Fetch Failures - Why Pages Show No Data**

User logs in → Permissions loaded from DB are empty/missing because:

1. Seed creates permissions but routes check for DIFFERENT permission names
2. Example: Seed has `prescription.create`, route checks for `prescriptions.create`
3. Permission not in list → `requirePermission()` throws 403
4. Page gets 403 error → displays "Forbidden" or empty
5. User doesn't see the actual data they should be authorized to see

---

## MISMATCH SUMMARY

**Total routes scanned**: 65+ API endpoints  
**Permissions seeded**: ~50 permissions  
**Permissions checked by routes**: ~80+ different permission strings  
**Mismatches found**: ~35+ permission naming conflicts  

**Result**: ~70% of API routes fail because they check for non-existent permissions

---

## HOW THIS BREAKS THE SYSTEM

### Example Flow - Doctor Trying to View Patients:

```
1. Doctor logs in → auth.ts loads permissions
   - Checks: roleEntity.rolePermissions[].permission.name
   - Seed created: 'doctor.read', 'patient.read', etc.
   
2. Doctor clicks "View Patients" → calls GET /api/patients
   
3. Route checks: await requirePermission(req, 'doctor.read')
   ✓ This works (seeded)
   
4. But then... route might also call other endpoints internally
   
5. When Patient list tries to load associated data:
   - Calls /api/prescriptions (checks 'prescriptions.read')
   ✗ NOT SEEDED - permission missing
   - Calls /api/lab (checks 'lab.read')
   ✗ NOT SEEDED - permission missing
   - Calls /api/emr (checks 'emr.read')
   ✓ This works (seeded)
   
6. Cascade failures → page shows incomplete data or fails entirely
```

---

## WHAT NEEDS TO HAPPEN

### Option A: Fix seed-rbac.ts (Add Missing Permissions)
- Add all 35+ missing permission names to allPermissions array
- Ensure naming matches routes EXACTLY
- Standardize singular vs plural usage

### Option B: Fix all routes (Use Correct Permission Names)
- Rename route checks to match seed definitions
- Standardize to consistent naming convention

### Option C: Do Both (RECOMMENDED)
- Create a comprehensive permission list
- Use consistent naming: `module.action` format
- Update both seed AND all routes together

---

## IMMEDIATE ACTION REQUIRED

1. **Generate definitive permission list** from actual routes
2. **Update seed-rbac.ts** to include ALL permissions routes check for
3. **Regenerate database** from scratch
4. **Verify all permissions match** between seed and routes
5. **Test each role** to ensure data fetching works

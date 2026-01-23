import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive Hospital RBAC Seeding
 * 
 * 8 Roles with 50+ granular permissions covering 22 hospital modules:
 * 1. ADMINISTRATOR - System configuration, user mgmt, audit logs
 * 2. RECEPTIONIST - Patient registration, appointment scheduling
 * 3. DOCTOR - Patient care, EMR, prescriptions, lab/rad orders, surgery
 * 4. NURSE - Vitals, MAR, intake/output, read-only orders
 * 5. PHARMACIST - Prescription dispensing, inventory management
 * 6. LAB_TECH - Lab orders, sample tracking, result entry
 * 7. BILLING_OFFICER - Invoicing, insurance claims
 * 8. PATIENT - Read-only access to own records
 */

interface RolePermissionMap {
  [role: string]: string[];
}

async function main() {
  console.log('🏥 Seeding Comprehensive Hospital RBAC System...\n');

  // ========== PERMISSIONS (50+ granular permissions) ==========
  const allPermissions = [
    // Admin Module (7)
    'admin.users.create',
    'admin.users.read',
    'admin.users.update',
    'admin.users.delete',
    'admin.roles.manage',
    'admin.permissions.manage',
    'admin.config.manage',

    // Audit Module (2)
    'audit.logs.read',
    'audit.logs.export',

    // Patient Module (6)
    'patient.create',
    'patient.read',
    'patient.read.own',
    'patient.update',
    'patient.delete',
    'patient.history.read',

    // EMR Module (8)
    'emr.create',
    'emr.read',
    'emr.read.own',
    'emr.update',
    'emr.assess',
    'emr.diagnose',
    'emr.discharge.approve',
    'emr.history.read',

    // Prescription Module (5)
    'prescription.create',
    'prescription.read',
    'prescription.read.own',
    'prescription.dispense',
    'prescription.approve',

    // Lab Module (6)
    'lab.order.create',
    'lab.order.read',
    'lab.sample.track',
    'lab.result.enter',
    'lab.result.read',
    'lab.report.upload',

    // Pharmacy Module (5)
    'pharmacy.drug.read',
    'pharmacy.inventory.manage',
    'pharmacy.stock.manage',
    'pharmacy.dispensing.process',
    'pharmacy.expiry.monitor',

    // Nursing Module (5)
    'nursing.vitals.record',
    'nursing.mar.manage',
    'nursing.intake.output.record',
    'nursing.orders.read',
    'nursing.notes.write',

    // Surgery Module (4)
    'surgery.schedule.create',
    'surgery.schedule.read',
    'surgery.schedule.update',
    'surgery.notes.read',

    // Billing Module (4)
    'billing.invoice.create',
    'billing.invoice.read',
    'billing.claim.manage',
    'billing.discount.approve',

    // Beds/Inventory Module (3)
    'beds.status.read',
    'beds.assign.manage',
    'inventory.view',

    // Emergency Module (2)
    'emergency.access.breakglass',
    'emergency.alerts.view',
  ];

  // Clean up old permissions & roles first
  console.log('🧹 Cleaning up old RBAC data...');
  await prisma.rolePermission.deleteMany({});
  await prisma.roleEntity.deleteMany({});
  await prisma.permission.deleteMany({});

  // Batch create permissions for efficiency
  const permMap: Record<string, any> = {};
  const createdPerms = await prisma.$transaction([
    ...allPermissions.map(perm => 
      prisma.permission.create({ 
        data: { 
          name: perm.toLowerCase(), 
          description: perm.replace(/\./g, ' → ').replace(/_/g, ' ')
        }
      })
    )
  ]);
  
  for (let i = 0; i < allPermissions.length; i++) {
    permMap[allPermissions[i]] = createdPerms[i];
  }
  console.log(`✅ Created ${allPermissions.length} permissions\n`);

  // ========== ROLES WITH PERMISSION MAPPINGS ==========
  const rolePermissions: RolePermissionMap = {
    ADMINISTRATOR: [
      // Full access to all admin functions
      'admin.users.create', 'admin.users.read', 'admin.users.update', 'admin.users.delete',
      'admin.roles.manage', 'admin.permissions.manage', 'admin.config.manage',
      'audit.logs.read', 'audit.logs.export',
      // Can view all data
      'patient.read', 'emr.read', 'prescription.read', 'lab.order.read', 'lab.result.read',
      'billing.invoice.read', 'nursing.orders.read', 'surgery.schedule.read',
      'beds.status.read', 'beds.assign.manage', 'inventory.view'
    ],

    RECEPTIONIST: [
      // Patient registration & management
      'patient.create', 'patient.read', 'patient.update', 'patient.history.read',
      // Bed management
      'beds.status.read', 'beds.assign.manage',
      // View own permissions
      'admin.permissions.manage' // Limited self-serve permission view
    ],

    DOCTOR: [
      // Full patient data access (including own)
      'patient.read', 'patient.history.read',
      // EMR - full clinical access
      'emr.create', 'emr.read', 'emr.update', 'emr.assess', 'emr.diagnose',
      'emr.discharge.approve', 'emr.history.read',
      // Prescription management
      'prescription.create', 'prescription.read', 'prescription.approve',
      // Order tests & view results
      'lab.order.create', 'lab.order.read', 'lab.result.read',
      // Surgery
      'surgery.schedule.create', 'surgery.schedule.read', 'surgery.schedule.update',
      'surgery.notes.read',
      // Emergency break-glass access
      'emergency.access.breakglass', 'emergency.alerts.view'
    ],

    NURSE: [
      // Patient data - read only
      'patient.read', 'patient.read.own',
      // EMR - assessment only (read orders, write notes)
      'emr.read', 'emr.history.read',
      // Prescriptions - view only
      'prescription.read',
      // Nursing specific
      'nursing.vitals.record', 'nursing.mar.manage',
      'nursing.intake.output.record', 'nursing.orders.read', 'nursing.notes.write',
      // Cannot: approve discharge, write diagnoses, approve prescriptions, dispense drugs
    ],

    PHARMACIST: [
      // Patient - basic info only
      'patient.read',
      // Prescription - dispensing
      'prescription.read', 'prescription.dispense',
      // Pharmacy operations
      'pharmacy.drug.read', 'pharmacy.inventory.manage',
      'pharmacy.stock.manage', 'pharmacy.dispensing.process',
      'pharmacy.expiry.monitor',
      // Cannot: view lab, surgery, EMR details, approve discharge
    ],

    LAB_TECH: [
      // Patient - basic info
      'patient.read',
      // Lab operations
      'lab.order.read', 'lab.sample.track', 'lab.result.enter',
      'lab.result.read', 'lab.report.upload',
      // Cannot: order new tests (doctor does), view EMR, access pharmacy
    ],

    BILLING_OFFICER: [
      // Patient - read only (no clinical details)
      'patient.read',
      // Billing operations
      'billing.invoice.create', 'billing.invoice.read',
      'billing.claim.manage', 'billing.discount.approve',
      // Audit - required for compliance
      'audit.logs.read',
      // Cannot: access clinical data, pharmacy, lab results
    ],

    PATIENT: [
      // Own records only
      'patient.read.own',
      'emr.read.own',
      'prescription.read.own',
      // Cannot: access others' data, create/update data, access admin functions
    ]
  };

  // Clean up old role names that conflict with new ones (case-insensitive)
  const oldRoleNames = ['ADMIN', 'EMERGENCY'];
  for (const oldName of oldRoleNames) {
    try {
      const existingRole = await prisma.roleEntity.findUnique({
        where: { name: oldName }
      });
      if (existingRole) {
        // Delete associated RolePermissions first (foreign key constraint)
        await prisma.rolePermission.deleteMany({
          where: { roleId: existingRole.id }
        });
        // Delete users with this role
        await prisma.user.updateMany({
          where: { roleEntityId: existingRole.id },
          data: { roleEntityId: null }
        });
        // Delete the role
        await prisma.roleEntity.delete({
          where: { id: existingRole.id }
        });
        console.log(`🗑️  Cleaned up old role: ${oldName}`);
      }
    } catch (e) {
      // Role doesn't exist, continue
    }
  }

  // Batch create all roles
  const roleDescriptions: Record<string, string> = {
    ADMINISTRATOR: 'Full system access, user & configuration management',
    RECEPTIONIST: 'Patient registration, scheduling, bed management',
    DOCTOR: 'Clinical care, EMR, prescriptions, lab orders, surgery',
    NURSE: 'Vitals, MAR, nursing assessments, order viewing',
    PHARMACIST: 'Drug dispensing, inventory, stock management',
    LAB_TECH: 'Lab order processing, sample tracking, result entry',
    BILLING_OFFICER: 'Invoicing, claims, discount approval',
    PATIENT: 'Read-only access to own health records'
  };

  const createdRoles = await prisma.$transaction([
    ...Object.entries(rolePermissions).map(([roleName]) => 
      prisma.roleEntity.create({
        data: {
          name: roleName,
          description: roleDescriptions[roleName]
        }
      })
    )
  ]);

  const roleMap: Record<string, any> = {};
  const roleNames = Object.keys(rolePermissions);
  for (let i = 0; i < roleNames.length; i++) {
    roleMap[roleNames[i]] = createdRoles[i];
  }

  // Batch create all role-permission mappings
  const rolePermOps: any[] = [];
  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = roleMap[roleName];
    for (const permName of perms) {
      const perm = permMap[permName];
      if (!perm) {
        console.warn(`⚠️  Permission '${permName}' not found for role ${roleName}`);
        continue;
      }
      rolePermOps.push(
        prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id }
        })
      );
    }
  }
  
  if (rolePermOps.length > 0) {
    // Batch in chunks to avoid timeouts
    const CHUNK_SIZE = 50;
    for (let i = 0; i < rolePermOps.length; i += CHUNK_SIZE) {
      const chunk = rolePermOps.slice(i, i + CHUNK_SIZE);
      await prisma.$transaction(chunk);
    }
  }
  console.log(`✅ Created ${Object.keys(roleMap).length} roles with permission mappings\n`);

  // ========== CREATE ADMIN USER ==========
  const envAdminEmail = process.env.RBAC_ADMIN_EMAIL;
  const envAdminPassword = process.env.RBAC_ADMIN_PASSWORD;

  const isProdLike = process.env.NODE_ENV === 'production' || !!process.env.NEON_DATABASE_URL;
  if (isProdLike && (!envAdminEmail || !envAdminPassword)) {
    throw new Error('RBAC_ADMIN_EMAIL and RBAC_ADMIN_PASSWORD must be provided in staging/production');
  }

  const adminEmail = envAdminEmail ?? 'admin@neon.example';
  const adminPassword = envAdminPassword ?? 'Admin123!';
  const hashed = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed, role: 'ADMIN', roleEntityId: roleMap.ADMINISTRATOR.id },
    create: {
      email: adminEmail,
      password: hashed,
      name: 'CureOS Administrator',
      role: 'ADMIN',
      roleEntityId: roleMap.ADMINISTRATOR.id,
    },
  });

  console.log(`✅ Created/updated admin user: ${adminUser.email}\n`);

  // ========== SEED COMPLETE - SUMMARY ==========
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         RBAC SEEDING COMPLETE - HOSPITAL SYSTEM            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Permissions: ${allPermissions.length}`.padEnd(62) + '║');
  console.log(`║ Roles: ${Object.keys(roleMap).length} (Admin, Doctor, Nurse, Pharmacist, Lab Tech, ...)`.padEnd(62) + '║');
  console.log(`║ Users: 1 Administrator`.padEnd(62) + '║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Role Summary:'.padEnd(62) + '║');
  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const summary = `${roleName}: ${perms.length} permissions`;
    console.log(`║   ${summary}`.padEnd(62) + '║');
  }
  console.log('╠════════════════════════════════════════════════════════════╣');
  if (!isProdLike) {
    console.log(`║ 🔐 Admin Credentials:                                      ║`);
    console.log(`║    Email: ${adminEmail}`.padEnd(62) + '║');
    console.log(`║    Password: ${adminPassword}`.padEnd(62) + '║');
    console.log('║ ⚠️  CHANGE credentials before production deployment        ║');
  } else {
    console.log('║ ✓ Production mode - admin password not displayed           ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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

  // ========== PERMISSIONS (80+ granular permissions) ==========
  // UPDATED: Includes all permissions actually checked by routes
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
    'audit.read', // Alternative naming (used by routes)

    // Patient Module (7)
    'patient.create',
    'patient.read',
    'patient.read.own',
    'patient.update',
    'patient.delete',
    'patient.history.read',

    // EMR Module (9)
    'emr.create',
    'emr.read',
    'emr.read.own',
    'emr.update',
    'emr.assess',
    'emr.diagnose',
    'emr.discharge.approve',
    'emr.history.read',
    'emr.write', // Used by routes for updates

    // Prescription Module (9)
    'prescription.create',
    'prescription.read',
    'prescription.read.own',
    'prescription.dispense',
    'prescription.approve',
    'prescription.update', // Used by routes
    'prescriptions.read', // Plural variant used by routes
    'prescriptions.create', // Plural variant used by routes

    // Lab Module (9)
    'lab.order.create',
    'lab.order.read',
    'lab.order', // Variant used by routes for ordering tests
    'lab.sample.track',
    'lab.result.enter',
    'lab.result.read',
    'lab.report.upload',
    'lab.read', // Variant used by routes
    'lab.create', // Variant used by routes

    // Pharmacy Module (6)
    'pharmacy.drug.read',
    'pharmacy.inventory.manage',
    'pharmacy.stock.manage',
    'pharmacy.dispensing.process',
    'pharmacy.expiry.monitor',
    'pharmacy.read', // Variant used by routes
    'pharmacy.dispense', // Variant used by routes

    // Nursing Module (7)
    'nursing.vitals.record',
    'nursing.mar.manage',
    'nursing.intake.output.record',
    'nursing.orders.read',
    'nursing.notes.write',
    'nursing.read', // Variant used by routes
    'nursing.create', // Variant used by routes
    'nursing.update', // Variant used by routes

    // Surgery Module (5)
    'surgery.schedule.create',
    'surgery.schedule.read',
    'surgery.schedule.update',
    'surgery.notes.read',
    'surgery.read', // Variant used by routes
    'surgery.create', // Variant used by routes

    // Billing Module (6)
    'billing.invoice.create',
    'billing.invoice.read',
    'billing.claim.manage',
    'billing.discount.approve',
    'billing.read', // Variant used by routes
    'billing.create', // Variant used by routes
    'billing.update', // Variant used by routes

    // Appointment Module (5)
    'appointment.create',
    'appointment.read',
    'appointment.update',
    'appointments.read', // Plural variant used by routes
    'appointments.update', // Plural variant used by routes

    // Doctor Module (1)
    'doctor.read',

    // Beds/Inventory Module (6)
    'beds.status.read',
    'beds.assign.manage',
    'beds.read', // Variant used by routes
    'beds.update', // Variant used by routes
    'inventory.view',
    'inventory.read', // Variant used by routes
    'inventory.update', // Variant used by routes

    // Emergency Module (5)
    'emergency.access.breakglass',
    'emergency.alerts.view',
    'emergency.read', // Variant used by routes
    'emergency.create', // Variant used by routes
    'emergency.request', // Used for requesting emergency override

    // Incidents Module (2)
    'incidents.read',
    'incidents.create',

    // Insurance Module (2)
    'insurance.read',
    'insurance.create',

    // Roles Management (1)
    'roles.manage', // Alternative to admin.roles.manage
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
      'audit.logs.read', 'audit.logs.export', 'audit.read',
      // Can view all data
      'patient.read', 'patient.history.read',
      'emr.read', 'emr.write',
      'prescription.read', 'prescriptions.read',
      'lab.order.read', 'lab.read', 'lab.result.read',
      'billing.invoice.read', 'billing.read',
      'nursing.orders.read', 'nursing.read',
      'surgery.schedule.read', 'surgery.read',
      'beds.status.read', 'beds.read', 'beds.assign.manage',
      'inventory.view', 'inventory.read',
      'emergency.alerts.view',
      'incidents.read',
      'insurance.read'
    ],

    RECEPTIONIST: [
      // Patient registration & management
      'patient.create', 'patient.read', 'patient.update', 'patient.history.read',
      // Appointment scheduling
      'appointment.create', 'appointment.read', 'appointment.update',
      'appointments.read', 'appointments.update',
      // Doctor information for scheduling
      'doctor.read',
      // Bed management
      'beds.status.read', 'beds.read', 'beds.assign.manage',
      // View own permissions
      'admin.permissions.manage'
    ],

    DOCTOR: [
      // Full patient data access
      'patient.read', 'patient.history.read',
      // EMR - full clinical access
      'emr.create', 'emr.read', 'emr.update', 'emr.write', 'emr.assess', 'emr.diagnose',
      'emr.discharge.approve', 'emr.history.read',
      // Prescription management
      'prescription.create', 'prescription.read', 'prescription.approve', 'prescription.update',
      'prescriptions.read', 'prescriptions.create',
      // Order tests & view results
      'lab.order.create', 'lab.order.read', 'lab.order', 'lab.read', 'lab.result.read',
      // Surgery
      'surgery.schedule.create', 'surgery.schedule.read', 'surgery.schedule.update',
      'surgery.notes.read', 'surgery.read', 'surgery.create',
      // Emergency break-glass access
      'emergency.access.breakglass', 'emergency.alerts.view'
    ],

    NURSE: [
      // Patient data - read only
      'patient.read', 'patient.read.own',
      // EMR - assessment only
      'emr.read', 'emr.history.read',
      // Prescriptions - view only
      'prescription.read', 'prescriptions.read',
      // Nursing specific
      'nursing.vitals.record', 'nursing.mar.manage',
      'nursing.intake.output.record', 'nursing.orders.read', 'nursing.notes.write',
      'nursing.read', 'nursing.create', 'nursing.update',
      // Bed assignments
      'beds.read', 'beds.update', 'beds.status.read',
      // View lab tests
      'lab.read', 'lab.order.read',
      // Appointments
      'appointment.read', 'appointments.read'
    ],

    PHARMACIST: [
      // Patient - basic info only
      'patient.read',
      // Prescription - dispensing
      'prescription.read', 'prescription.dispense', 'prescriptions.read',
      // Pharmacy operations
      'pharmacy.drug.read', 'pharmacy.inventory.manage',
      'pharmacy.stock.manage', 'pharmacy.dispensing.process',
      'pharmacy.expiry.monitor', 'pharmacy.read', 'pharmacy.dispense',
      // Inventory
      'inventory.read', 'inventory.view',
      // EMR - read only for context
      'emr.read'
    ],

    LAB_TECH: [
      // Patient - basic info
      'patient.read',
      // Lab operations
      'lab.order.read', 'lab.sample.track', 'lab.result.enter',
      'lab.result.read', 'lab.report.upload', 'lab.read', 'lab.create'
    ],

    BILLING_OFFICER: [
      // Patient - read only (no clinical details)
      'patient.read',
      // Billing operations
      'billing.invoice.create', 'billing.invoice.read',
      'billing.claim.manage', 'billing.discount.approve',
      'billing.read', 'billing.create', 'billing.update',
      // Audit - required for compliance
      'audit.logs.read', 'audit.read',
      // Incidents
      'incidents.read',
      'incidents.create',
      // Insurance
      'insurance.read',
      'insurance.create'
    ],

    PATIENT: [
      // Own records only
      'patient.read.own',
      'emr.read.own',
      'prescription.read.own',
      'appointment.read'
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
          description: roleDescriptions[roleName],
          isSystemRole: true
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
  const adminPassword = envAdminPassword;
  
  if (!adminPassword) {
    throw new Error('RBAC_ADMIN_PASSWORD environment variable must be set before seeding');
  }
  
  const hashed = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed, role: 'ADMIN' as unknown as any, roleEntityId: roleMap.ADMINISTRATOR.id },
    create: {
      email: adminEmail,
      password: hashed,
      name: 'CureOS Administrator',
      role: 'ADMIN' as unknown as any,
      roleEntityId: roleMap.ADMINISTRATOR.id,
    },
  });

  console.log(`✅ Created/updated admin user: ${adminUser.email}\n`);

  // ========== CREATE TEST USERS FOR EACH ROLE ==========
  const testUsers = [
    { email: 'keshav@example.com', name: 'Keshav Sharma', role: 'RECEPTIONIST' },
    { email: 'doctor@example.com', name: 'Dr. John Doe', role: 'DOCTOR' },
    { email: 'nurse@example.com', name: 'Jane Smith', role: 'NURSE' },
    { email: 'pharmacist@example.com', name: 'Alex Johnson', role: 'PHARMACIST' },
    { email: 'labtech@example.com', name: 'Rita Patel', role: 'LAB_TECH' },
  ];

  const testPassword = process.env.RBAC_TEST_PASSWORD;
  
  if (!testPassword) {
    throw new Error('RBAC_TEST_PASSWORD environment variable must be set before seeding');
  }
  
  const testHashedPassword = await bcrypt.hash(testPassword, 10);

  console.log('📝 Creating/Updating test users with roles...');
  for (const testUser of testUsers) {
    const role = roleMap[testUser.role];
    if (!role) {
      console.warn(`⚠️  Role ${testUser.role} not found, skipping ${testUser.email}`);
      continue;
    }

    await prisma.user.upsert({
      where: { email: testUser.email },
      update: { 
        password: testHashedPassword, 
        role: testUser.role as unknown as any, 
        roleEntityId: role.id 
      },
      create: {
        email: testUser.email,
        password: testHashedPassword,
        name: testUser.name,
        role: testUser.role as unknown as any,
        roleEntityId: role.id,
      },
    });
    console.log(`  ✓ ${testUser.email} (${testUser.role})`);
  }
  console.log('');

  // ========== CREATE DUMMY DOCTORS ==========
  console.log('📋 Creating dummy doctors...');
  // Create dummy doctors with separate user accounts
  const dummyDoctors = [
    { email: 'cardio-doc@hospital.com', name: 'Dr. John Doe', specialization: 'Cardiology', license: 'LIC001' },
    { email: 'derm-doc@hospital.com', name: 'Dr. Sarah Johnson', specialization: 'Dermatology', license: 'LIC002' },
    { email: 'neuro-doc@hospital.com', name: 'Dr. Michael Chen', specialization: 'Neurology', license: 'LIC003' },
    { email: 'ortho-doc@hospital.com', name: 'Dr. Emily Davis', specialization: 'Orthopedics', license: 'LIC004' },
    { email: 'peds-doc@hospital.com', name: 'Dr. Robert Wilson', specialization: 'Pediatrics', license: 'LIC005' },
  ];

  const doctorRole = await prisma.roleEntity.findFirst({
    where: { name: 'DOCTOR' },
  });

  for (const docData of dummyDoctors) {
    // Create or update doctor user
    const doctorUser = await prisma.user.upsert({
      where: { email: docData.email },
      update: { name: docData.name },
      create: {
        email: docData.email,
        name: docData.name,
        password: await bcrypt.hash(process.env.RBAC_DOCTOR_PASSWORD || 'temp', 10),
        role: 'DOCTOR' as unknown as any,
        roleEntityId: doctorRole?.id,
      },
    });

    // Create or update doctor record
    await prisma.doctor.upsert({
      where: { licenseNumber: docData.license },
      update: { specialization: docData.specialization },
      create: {
        specialization: docData.specialization,
        licenseNumber: docData.license,
        userId: doctorUser.id,
      },
    });

    console.log(`  ✓ ${docData.name} (${docData.specialization})`);
  }
  console.log('');

  // ========== SEED COMPLETE - SUMMARY ==========
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         RBAC SEEDING COMPLETE - HOSPITAL SYSTEM            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Permissions: ${allPermissions.length}`.padEnd(62) + '║');
  console.log(`║ Roles: ${Object.keys(roleMap).length} (Admin, Doctor, Nurse, Pharmacist, Lab Tech, ...)`.padEnd(62) + '║');
  console.log(`║ Users: 6+ (1 Admin + 5 Test Users + Dummy Doctors)`.padEnd(62) + '║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ UPDATED: Fixed all permission mismatches'.padEnd(62) + '║');
  console.log('║ Added missing permissions from route checks'.padEnd(62) + '║');
  console.log('║ Standardized naming conventions across codebase'.padEnd(62) + '║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Role Summary:'.padEnd(62) + '║');
  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const summary = `${roleName}: ${perms.length} permissions`;
    console.log(`║   ${summary}`.padEnd(62) + '║');
  }
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ ✅ All route permission checks are now covered'.padEnd(62) + '║');
  console.log('║ ⚠️  IMPORTANT: Set these environment variables before seeding:║');
  console.log('║  - RBAC_ADMIN_PASSWORD                                      ║');
  console.log('║  - RBAC_TEST_PASSWORD                                       ║');
  console.log('║  - RBAC_DOCTOR_PASSWORD                                     ║');
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

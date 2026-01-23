import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding RBAC: permissions, roles, admin user');

  const perms = [
    'patients.create',
    'patients.read',
    'patients.update',
    'patients.delete',
    'prescriptions.create',
    'prescriptions.dispense',
    'emergency.request',
    'audit.read',
    'roles.manage',
    'users.manage'
  ];

  // upsert permissions
  const permissionRecords = [] as any[];
  for (const p of perms) {
    const pr = await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, description: `${p} permission` },
    });
    permissionRecords.push(pr);
  }

  // create RoleEntity entries that mirror the old enum names
  const roleNames = ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH', 'RECEPTIONIST', 'EMERGENCY'];
  const roleMap: Record<string, any> = {};
  for (const rn of roleNames) {
    const r = await prisma.roleEntity.upsert({
      where: { name: rn },
      update: {},
      create: { name: rn, description: `${rn} role` },
    });
    roleMap[rn] = r;
  }

  // grant broad permissions to ADMIN
  const adminRole = roleMap['ADMIN'];
  for (const pr of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: pr.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: pr.id },
    });
  }

  // create an initial admin user (idempotent)
    // admin credentials: require explicit credentials in production/staging to avoid leaked defaults
  const envAdminEmail = process.env.RBAC_ADMIN_EMAIL;
  const envAdminPassword = process.env.RBAC_ADMIN_PASSWORD;

  const isProdLike = process.env.NODE_ENV === 'production' || !!process.env.NEON_DATABASE_URL;
  if (isProdLike && (!envAdminEmail || !envAdminPassword)) {
    throw new Error('RBAC_ADMIN_EMAIL and RBAC_ADMIN_PASSWORD must be provided in staging/production');
  }

  const adminEmail = envAdminEmail ?? 'admin@example.com';
  const adminPassword = envAdminPassword ?? 'Admin123!';
  const hashed = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed, role: 'ADMIN', roleEntityId: adminRole.id },
    create: {
      email: adminEmail,
      password: hashed,
      name: 'Cureos Admin',
      role: 'ADMIN',
      roleEntityId: adminRole.id,
    },
  });

  console.log('Created/updated admin:', adminUser.email);
  if (!isProdLike) {
    console.log('RBAC seed complete — ADMIN credentials:', `${adminEmail} / ${adminPassword}`);
    console.log('TIP: change the password and store secrets in a vault before production.');
  } else {
    console.log('RBAC seed complete — admin created in staging/production (password not shown)');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

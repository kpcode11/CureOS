import { prisma } from '@/lib/prisma';

export const listRoles = async () => {
  return prisma.roleEntity.findMany({ include: { rolePermissions: { include: { permission: true } } } });
};

export const getRole = async (id: string) => {
  return prisma.roleEntity.findUnique({ where: { id }, include: { rolePermissions: { include: { permission: true } } } });
};

export const createRole = async (name: string, permissionNames: string[] = []) => {
  const role = await prisma.roleEntity.create({ data: { name, description: name } });
  if (permissionNames.length) {
    const perms = await prisma.permission.findMany({ where: { name: { in: permissionNames } } });
    await Promise.all(perms.map((p) => prisma.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } } )));
  }
  return getRole(role.id as string);
};

export const assignPermissions = async (roleId: string, permissionNames: string[]) => {
  const perms = await prisma.permission.findMany({ where: { name: { in: permissionNames } } });
  return Promise.all(perms.map((p) => prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId: p.id } }, update: {}, create: { roleId, permissionId: p.id } } )));
};

export const updateRole = async (roleId: string, opts: { name?: string; permissionNames?: string[] }) => {
  const role = await prisma.roleEntity.findUnique({ where: { id: roleId } });
  if (!role) throw new Error('Role not found');
  const data: any = {};
  if (opts.name) data.name = opts.name;
  if (Object.keys(data).length) await prisma.roleEntity.update({ where: { id: roleId }, data });

  if (Array.isArray(opts.permissionNames)) {
    // replace permissions: remove rolePermissions not in the new set, upsert the rest
    const perms = await prisma.permission.findMany({ where: { name: { in: opts.permissionNames } } });
    const permIds = perms.map((p) => p.id);
    // delete obsolete
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId: { notIn: permIds } } });
    // upsert desired
    await Promise.all(perms.map((p) => prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId: p.id } }, update: {}, create: { roleId, permissionId: p.id } })));
  }

  return getRole(roleId);
};

export const deleteRole = async (roleId: string) => {
  const role = await prisma.roleEntity.findUnique({ where: { id: roleId }, include: { _count: { select: { users: true } } } });
  if (!role) throw new Error('Role not found');
  if (role.name === 'ADMIN') throw new Error('Cannot delete ADMIN role');
  if ((role as any)._count?.users) throw new Error('Role has assigned users');
  await prisma.rolePermission.deleteMany({ where: { roleId } });
  return prisma.roleEntity.delete({ where: { id: roleId } });
};

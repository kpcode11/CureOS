import { prisma } from "@/lib/prisma";

export const listRoles = async () => {
  return prisma.roleEntity.findMany({
    include: { rolePermissions: { include: { permission: true } } },
  });
};

export const getRole = async (id: string) => {
  return prisma.roleEntity.findUnique({
    where: { id },
    include: { rolePermissions: { include: { permission: true } } },
  });
};

export const createRole = async (
  name: string,
  permissionNames: string[] = [],
) => {
  // Normalize name to lowercase
  const normalizedName = name.toLowerCase();

  // Check for duplicate role (case-insensitive)
  const existingRole = await prisma.roleEntity.findUnique({
    where: { name: normalizedName },
  });
  if (existingRole) throw new Error("Role already exists");

  // Use transaction for safety
  const role = await prisma.$transaction(
    async (tx) => {
      const newRole = await tx.roleEntity.create({
        data: { name: normalizedName, description: name },
      });

      if (permissionNames.length) {
        const perms = await tx.permission.findMany({
          where: { name: { in: permissionNames.map((p) => p.toLowerCase()) } },
        });

        // Use createMany for better performance
        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map((p) => ({
              roleId: newRole.id,
              permissionId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return newRole;
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );

  return getRole(role.id);
};

export const assignPermissions = async (
  roleId: string,
  permissionNames: string[],
) => {
  // Use transaction for safety
  return prisma.$transaction(
    async (tx) => {
      const normalizedNames = permissionNames.map((p) => p.toLowerCase());
      const perms = await tx.permission.findMany({
        where: { name: { in: normalizedNames } },
      });

      if (perms.length > 0) {
        // Use createMany with skipDuplicates for better performance
        await tx.rolePermission.createMany({
          data: perms.map((p) => ({ roleId, permissionId: p.id })),
          skipDuplicates: true,
        });
      }

      return tx.rolePermission.findMany({
        where: { roleId },
        include: { permission: true },
      });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

export const updateRole = async (
  roleId: string,
  opts: { name?: string; permissionNames?: string[] },
) => {
  return prisma.$transaction(
    async (tx) => {
      const role = await tx.roleEntity.findUnique({ where: { id: roleId } });
      if (!role) throw new Error("Role not found");

      const data: any = {};
      if (opts.name) {
        const normalizedName = opts.name.toLowerCase();

        // Check for duplicate (case-insensitive), but allow self-update
        const existingRole = await tx.roleEntity.findUnique({
          where: { name: normalizedName },
        });
        if (existingRole && existingRole.id !== roleId) {
          throw new Error("Role name already exists");
        }

        data.name = normalizedName;
      }

      if (Object.keys(data).length) {
        await tx.roleEntity.update({ where: { id: roleId }, data });
      }

      if (Array.isArray(opts.permissionNames)) {
        const normalizedNames = opts.permissionNames.map((p) =>
          p.toLowerCase(),
        );
        const perms = await tx.permission.findMany({
          where: { name: { in: normalizedNames } },
        });
        const permIds = perms.map((p) => p.id);

        // Delete all existing permissions first
        await tx.rolePermission.deleteMany({ where: { roleId } });

        // Create new permissions in bulk if any
        if (permIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permIds.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.roleEntity.findUnique({
        where: { id: roleId },
        include: { rolePermissions: { include: { permission: true } } },
      });
    },
    {
      maxWait: 10000, // Maximum time to wait to start transaction (10 seconds)
      timeout: 15000, // Maximum time for transaction to complete (15 seconds)
    },
  );
};

export const deleteRole = async (roleId: string) => {
  return prisma.$transaction(
    async (tx) => {
      const role = await tx.roleEntity.findUnique({
        where: { id: roleId },
        include: { _count: { select: { users: true } } },
      });

      if (!role) throw new Error("Role not found");
      if (role.name === "admin") throw new Error("Cannot delete ADMIN role");
      if ((role as any)._count?.users)
        throw new Error("Role has assigned users");

      await tx.rolePermission.deleteMany({ where: { roleId } });
      return tx.roleEntity.delete({ where: { id: roleId } });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

export const removeRoleFromUser = async (
  userId: string,
  roleId: string,
  actorId?: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      // Prevent admin from removing their own admin role
      if (actorId === userId) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { roleEntity: true },
        });
        if (user?.roleEntity?.name === "admin") {
          throw new Error("Cannot remove your own ADMIN role");
        }
      }

      // Check if this would remove the last admin
      const role = await tx.roleEntity.findUnique({ where: { id: roleId } });
      if (role?.name === "admin") {
        const adminCount = await tx.user.count({
          where: { roleEntity: { name: "admin" } },
        });
        if (adminCount <= 1) {
          throw new Error("Cannot remove last ADMIN user");
        }
      }

      return tx.user.update({
        where: { id: userId },
        data: { roleEntityId: null },
      });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

export const assignRoleToUser = async (userId: string, roleId: string) => {
  return prisma.$transaction(
    async (tx) => {
      const role = await tx.roleEntity.findUnique({ where: { id: roleId } });
      if (!role) throw new Error("Role not found");

      return tx.user.update({
        where: { id: userId },
        data: { roleEntityId: roleId },
        include: {
          roleEntity: {
            include: { rolePermissions: { include: { permission: true } } },
          },
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );
};

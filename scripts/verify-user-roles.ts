/**
 * Script to verify user role assignments and permissions
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyUserRoles() {
  console.log("🔍 Verifying user role assignments and permissions...\n");

  try {
    // Get all users with their role entities and permissions
    const users = await prisma.user.findMany({
      include: {
        roleEntity: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   Role Enum: ${user.role}`);
      console.log(`   RoleEntity: ${user.roleEntity?.name || "❌ NONE"}`);

      if (user.roleEntity) {
        const permissions = user.roleEntity.rolePermissions.map(
          (rp) => rp.permission.name,
        );
        console.log(`   Permissions (${permissions.length}):`);
        if (permissions.length > 0) {
          permissions.slice(0, 5).forEach((p) => console.log(`      - ${p}`));
          if (permissions.length > 5) {
            console.log(`      ... and ${permissions.length - 5} more`);
          }
        } else {
          console.log(`      ⚠️  No permissions assigned!`);
        }
      } else {
        console.log(`   ❌ NO PERMISSIONS - User has no RoleEntity!`);
      }
      console.log("");
    }

    // Check for any users still missing roleEntityId
    const usersWithoutRoleEntity = users.filter((u) => !u.roleEntityId);
    if (usersWithoutRoleEntity.length > 0) {
      console.log(
        `\n⚠️  Warning: ${usersWithoutRoleEntity.length} users still have no roleEntityId:`,
      );
      usersWithoutRoleEntity.forEach((u) => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
      });
    } else {
      console.log("✅ All users have proper roleEntityId assignments!");
    }
  } catch (error) {
    console.error("❌ Error verifying user roles:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyUserRoles().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

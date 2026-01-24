/**
 * Script to fix users who have a role enum but no roleEntityId
 * This assigns them to the corresponding RoleEntity
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log("🔧 Fixing user role assignments...\n");

  try {
    // Find all users with a role but no roleEntityId
    const usersWithoutRoleEntity = await prisma.user.findMany({
      where: {
        roleEntityId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (usersWithoutRoleEntity.length === 0) {
      console.log("✅ All users have proper role assignments!");
      return;
    }

    console.log(
      `Found ${usersWithoutRoleEntity.length} users without roleEntityId:\n`,
    );

    for (const user of usersWithoutRoleEntity) {
      console.log(`👤 ${user.name} (${user.email}) - Role: ${user.role}`);

      // Find the corresponding RoleEntity
      const roleEntity = await prisma.roleEntity.findFirst({
        where: {
          name: {
            equals: user.role,
            mode: "insensitive",
          },
        },
      });

      if (roleEntity) {
        // Update user with the roleEntityId
        await prisma.user.update({
          where: { id: user.id },
          data: { roleEntityId: roleEntity.id },
        });
        console.log(
          `   ✅ Assigned to RoleEntity: ${roleEntity.name} (${roleEntity.id})`,
        );
      } else {
        console.log(
          `   ⚠️  No matching RoleEntity found for role: ${user.role}`,
        );
        console.log(
          `   📝 You may need to create a RoleEntity for this role first`,
        );
      }
      console.log("");
    }

    console.log("\n🎉 User role assignment fix complete!");
    console.log(
      "\n💡 Users should now have proper permissions. Ask them to log out and log back in.",
    );
  } catch (error) {
    console.error("❌ Error fixing user roles:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

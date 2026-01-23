import { prisma } from '@/lib/prisma';

export const listPermissions = async () => {
  return prisma.permission.findMany({ orderBy: { name: 'asc' } });
};

export const findPermission = async (name: string) => {
  // Case-insensitive lookup
  const normalizedName = name.toLowerCase();
  return prisma.permission.findUnique({ where: { name: normalizedName } });
};

export const ensurePermissions = async (names: string[]) => {
  return prisma.$transaction(async (tx) => {
    const out = [] as any[];
    for (const n of names) {
      // Normalize name to lowercase
      const normalizedName = n.toLowerCase();
      
      const p = await tx.permission.upsert({
        where: { name: normalizedName },
        update: {},
        create: { name: normalizedName },
      });
      out.push(p);
    }
    return out;
  });
};

export const createPermission = async (name: string, description?: string) => {
  // Normalize name to lowercase
  const normalizedName = name.toLowerCase();

  // Check for duplicate permission (case-insensitive)
  const existing = await prisma.permission.findUnique({ where: { name: normalizedName } });
  if (existing) throw new Error('Permission already exists');

  return prisma.permission.create({ 
    data: { name: normalizedName, description: description || normalizedName } 
  });
};

import { prisma } from '@/lib/prisma';

export const listPermissions = async () => {
  return prisma.permission.findMany({ orderBy: { name: 'asc' } });
};

export const findPermission = async (name: string) => {
  return prisma.permission.findUnique({ where: { name } });
};

export const ensurePermissions = async (names: string[]) => {
  const out = [] as any[];
  for (const n of names) {
    const p = await prisma.permission.upsert({
      where: { name: n },
      update: {},
      create: { name: n },
    });
    out.push(p);
  }
  return out;
};

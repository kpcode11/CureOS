// src/lib/lab.ts
import { prisma } from './prisma';
import { getCurrentUser } from './auth';

export async function getCurrentLabTech() {
  const user = await getCurrentUser();
  if (user.role !== 'LAB_TECH') {
    throw new Error('FORBIDDEN');
  }

  const labTech = await prisma.labTech.findUnique({
    where: { userId: user.id },
  });

  if (!labTech) {
    throw new Error('LAB_TECH_NOT_FOUND');
  }

  return { user, labTech };
}

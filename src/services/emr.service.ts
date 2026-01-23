/* EMR service (restored minimal) */
import { prisma } from '@/lib/prisma';

export const listEMR = async (opts?: { take?: number }) => prisma.eMR.findMany({ take: opts?.take ?? 100 });
export const createEMR = async (data: any) => prisma.eMR.create({ data });
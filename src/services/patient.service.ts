/* patient.service.ts — minimal implementations to restore backend compile */
import { prisma } from '@/lib/prisma';

export const listPatients = async (opts?: { take?: number }) => {
  return prisma.patient.findMany({ take: opts?.take ?? 100, orderBy: { createdAt: 'desc' } });
};

export const getPatient = async (id: string) => {
  return prisma.patient.findUnique({ where: { id } });
};

export const createPatient = async (data: any) => {
  return prisma.patient.create({ data });
};
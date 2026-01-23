/* surgery.service.ts — restored minimal backend stub (original implementation was overwritten accidentally) */

import { prisma } from '@/lib/prisma';

export const listSurgeries = async () => {
  return prisma.surgery.findMany({ take: 100, orderBy: { scheduledAt: 'desc' } });
};

export const createSurgery = async (data: { doctorId: string; patientName: string; surgeryType: string; scheduledAt: string }) => {
  return prisma.surgery.create({ data: { doctorId: data.doctorId, patientName: data.patientName, surgeryType: data.surgeryType, scheduledAt: new Date(data.scheduledAt) } });
};
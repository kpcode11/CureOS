import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const createEmergencyOverride = async (opts: { actorId: string; reason: string; targetUserId?: string | null; ttlMinutes?: number }) => {
  const token = crypto.randomBytes(24).toString('hex');
  const ttl = opts.ttlMinutes ?? 15;
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000);
  const rec = await prisma.emergencyOverride.create({ data: { token, actorId: opts.actorId, reason: opts.reason, targetUserId: opts.targetUserId ?? null, expiresAt } });
  return { token, expiresAt, id: rec.id };
};

export const consumeEmergencyOverride = async (token: string) => {
  const rec = await prisma.emergencyOverride.findUnique({ where: { token } });
  if (!rec) throw new Error('Invalid override token');
  if (rec.used) throw new Error('Override token already used');
  if (rec.expiresAt < new Date()) throw new Error('Override token expired');
  const updated = await prisma.emergencyOverride.update({ where: { id: rec.id }, data: { used: true } });
  return updated;
};

export const listEmergencyOverrides = async (opts?: { onlyActive?: boolean }) => {
  let where: any = {};
  if (opts?.onlyActive) where = { used: false, expiresAt: { gt: new Date() } };
  return prisma.emergencyOverride.findMany({ where, include: { actor: { select: { id: true, email: true, name: true } }, targetUser: { select: { id: true, email: true } } }, orderBy: { createdAt: 'desc' } });
};

export const expireEmergencyOverride = async (id: string, actorId?: string) => {
  const rec = await prisma.emergencyOverride.findUnique({ where: { id } });
  if (!rec) throw new Error('Override not found');
  if (rec.used) return rec; // already used/expired
  const updated = await prisma.emergencyOverride.update({ where: { id }, data: { used: true, expiresAt: new Date() } });
  // record audit outside service (caller may include actorId)
  return updated;
};

import { describe, it, expect, vi } from 'vitest';
import * as authService from '@/services/auth.service';
import * as prisma from '@/lib/prisma';

describe('auth.service (emergency override)', () => {
  it('creates and consumes an override token', async () => {
    // mock prisma.emergencyOverride.create/findUnique/update
    const fake = { id: 'abc', token: 'tok', actorId: 'u1', reason: 'test', expiresAt: new Date(Date.now() + 10000), used: false } as any;

    // spy on the Prisma client's emergencyOverride methods directly
    const createSpy = vi.spyOn((prisma as any).prisma.emergencyOverride, 'create').mockResolvedValue(fake);
    const findSpy = vi.spyOn((prisma as any).prisma.emergencyOverride, 'findUnique').mockResolvedValue(fake);
    const updateSpy = vi.spyOn((prisma as any).prisma.emergencyOverride, 'update').mockResolvedValue({ ...fake, used: true });

    const created = await authService.createEmergencyOverride({ actorId: 'u1', reason: 'testing', ttlMinutes: 1 });
    expect(created).toHaveProperty('token');

    const consumed = await authService.consumeEmergencyOverride(created.token);
    expect(consumed.used).toBe(true);

    createSpy.mockRestore();
    findSpy.mockRestore();
    updateSpy.mockRestore();
  });
});

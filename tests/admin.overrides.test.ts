import { describe, it, expect, vi } from 'vitest';
import * as authService from '@/services/auth.service';
import { listEmergencyOverrides, expireEmergencyOverride } from '@/services/auth.service';
import { prisma } from '@/lib/prisma';

describe('auth.service - overrides (unit)', () => {
  it('lists active overrides', async () => {
    vi.spyOn((authService as any).prisma.emergencyOverride, 'findMany').mockResolvedValueOnce([{ id: 'o1', token: 't', used: false }]);
    const list = await listEmergencyOverrides({ onlyActive: true } as any);
    expect(list).toHaveLength(1);
  });

  it('expireEmergencyOverride marks used', async () => {
    const fake = { id: 'o1', used: false } as any;
    vi.spyOn((authService as any).prisma.emergencyOverride, 'findUnique').mockResolvedValueOnce(fake);
    vi.spyOn((authService as any).prisma.emergencyOverride, 'update').mockResolvedValueOnce({ ...fake, used: true });
    const res = await expireEmergencyOverride('o1');
    expect(res.used).toBeTruthy();
  });
});

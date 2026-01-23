import { describe, it, expect, vi } from 'vitest';
import * as authLib from '@/lib/authorization';

describe('authorization helper', () => {
  it('throws when permission missing and no override', async () => {
    // mock getSession to return a session without permissions
    const getSession = vi.spyOn(authLib, 'getSession' as any).mockResolvedValue({ user: { id: 'u1', permissions: [] } } as any);
    await expect(authLib.requirePermission(undefined as any, 'patients.read')).rejects.toThrow();
    getSession.mockRestore();
  });
});

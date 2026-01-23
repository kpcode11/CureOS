import { describe, it, expect, vi } from 'vitest';
import * as usersRoute from '@/app/api/admin/users/[id]/route';
import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

describe('admin users route handlers', () => {
  it('GET returns 403 when unauthorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
    const res = await usersRoute.GET(new Request('http://localhost'), { params: { id: 'u1' } } as any);
    expect((res as any).status).toBe(403);
  });

  it('PUT updates user when authorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'admin' } } } as any);
    vi.spyOn(prisma.user, 'update' as any).mockResolvedValueOnce({ id: 'u1', email: 'x@y' } as any);
    const res: any = await usersRoute.PUT(new Request('http://localhost', { method: 'PUT', body: JSON.stringify({ name: 'X' }) }), { params: { id: 'u1' } } as any);
    const json = await res.json();
    expect(json.id).toBe('u1');
  });
});

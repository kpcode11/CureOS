import { describe, it, expect, vi } from 'vitest';
import * as usersRoute from '@/app/api/admin/users/route';
import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

describe('POST /api/admin/users', () => {
  it('accepts friendly role "lab_tech" and maps to LAB_TECH', async () => {
    vi.spyOn(authLib as any, 'requirePermission').mockResolvedValueOnce(true as any);
    const created = { id: 'u1', email: 'x@y' } as any;
    // prisma.user.create is not always enumerable for vi.spyOn in the test runner —
    // assign a mock directly on the runtime client for reliability.
    const createSpy = (prisma.user as any).create = vi.fn().mockResolvedValueOnce(created);

    const body = { email: 'a@b.com', password: 'p', name: 'X', role: 'lab_tech' };
    const req = new Request('http://localhost/api/admin/users', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) as any;
    const res: any = await usersRoute.POST(req);

    // assert the create call included the normalized enum role (use matcher instead of inspecting mock internals)
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: 'LAB_TECH' })
    }));

    const json = await res.json();
    expect(json.email).toBe('x@y');
  });

  it('returns 400 for an unknown/invalid role string', async () => {
    vi.spyOn(authLib as any, 'requirePermission').mockResolvedValueOnce(true as any);
    const req = new Request('http://localhost/api/admin/users', { method: 'POST', body: JSON.stringify({ email: 'a@b.com', password: 'p', role: 'billing' }), headers: { 'content-type': 'application/json' } }) as any;
    const res: any = await usersRoute.POST(req);
    expect((res as any).status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid role/i);
  });
});

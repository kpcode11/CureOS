import { describe, it, expect, vi } from 'vitest';
import * as rolesRoute from '@/app/api/admin/roles/[id]/route';
import * as authLib from '@/lib/authorization';
import * as roleService from '@/services/role.service';

describe('admin roles route handlers', () => {
  it('GET returns 403 when unauthorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
    const res = await rolesRoute.GET(new Request('http://localhost'), { params: { id: 'r1' } } as any);
    // NextResponse.json returns a Response; check status
    expect((res as any).status).toBe(403);
  });

  it('GET returns role when authorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(roleService, 'getRole' as any).mockResolvedValueOnce({ id: 'r1', name: 'TEST' } as any);
    const res: any = await rolesRoute.GET(new Request('http://localhost'), { params: { id: 'r1' } } as any);
    const json = await res.json();
    expect(json.id).toBe('r1');
  });
});

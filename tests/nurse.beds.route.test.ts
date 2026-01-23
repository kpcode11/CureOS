// @ts-nocheck
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as bedsRoute from '@/app/api/nurse/beds/route';
import * as availableRoute from '@/app/api/nurse/beds/available/route';
import * as bedStatusRoute from '@/app/api/nurse/beds/[bedId]/status/route';
import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';


describe('nurse beds routes', () => {
  afterEach(() => vi.restoreAllMocks());
  it('GET /api/nurse/beds returns 403 when unauthorized', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockRejectedValueOnce(new Error('no'));
    const res: any = await bedsRoute.GET(new Request('http://localhost')) as any;
    expect(res.status).toBe(403);
  });

  it('GET /api/nurse/beds/available returns only AVAILABLE beds', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({} as any);
    const fake = [{ id: 'b1', bedNumber: '1', ward: 'A', bedType: 'standard', status: 'AVAILABLE' }];
    vi.spyOn(prisma.bed as any, 'findMany').mockResolvedValueOnce(fake as any);

    const res: any = await availableRoute.GET(new Request('http://localhost')) as any;
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].status).toBe('AVAILABLE');
  });

  it('PATCH bed status -> AVAILABLE returns 409 when active assignment exists', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma.bed as any, 'findUnique').mockResolvedValueOnce({ id: 'b1', status: 'OCCUPIED' } as any);
    vi.spyOn(prisma.bedAssignment as any, 'findFirst').mockResolvedValueOnce({ id: 'a1', bedId: 'b1', dischargedAt: null } as any);

    const req = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ status: 'AVAILABLE' }) });
    const res: any = await bedStatusRoute.PATCH(req as any, { params: { bedId: 'b1' } } as any) as any;
    expect(res.status).toBe(409);
  });

  it('PATCH bed status -> MAINTENANCE updates and audits', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma.bed as any, 'findUnique').mockResolvedValueOnce({ id: 'b1', status: 'AVAILABLE' } as any);
    vi.spyOn(prisma.bed as any, 'update').mockResolvedValueOnce({ id: 'b1', status: 'MAINTENANCE' } as any);
    vi.spyOn(prisma.bedAssignment as any, 'findFirst').mockResolvedValueOnce(null as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ status: 'MAINTENANCE' }) });
    const res: any = await bedStatusRoute.PATCH(req as any, { params: { bedId: 'b1' } } as any) as any;
    const json = await res.json();
    expect(json.status).toBe('MAINTENANCE');
    expect(auditSpy).toHaveBeenCalled();
  });
});

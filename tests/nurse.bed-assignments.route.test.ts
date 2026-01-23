// @ts-nocheck
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as assignmentsRoute from '@/app/api/nurse/bed-assignments/route';
import * as dischargeRoute from '@/app/api/nurse/bed-assignments/[id]/discharge/route';
import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';

describe('nurse bed-assignments routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST assigns a bed when available', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma.bed as any, 'findUnique').mockResolvedValueOnce({ id: 'b1', status: 'AVAILABLE' } as any);
    vi.spyOn(prisma.patient as any, 'findUnique').mockResolvedValueOnce({ id: 'p1' } as any);
    vi.spyOn(prisma.bedAssignment as any, 'findFirst').mockResolvedValueOnce(null as any);
    vi.spyOn(prisma.nurse as any, 'findUnique').mockResolvedValueOnce({ id: 'n1' } as any);
    const fakeAssign = { id: 'a1', bedId: 'b1', patientId: 'p1', nurseId: 'n1' } as any;
    vi.spyOn(prisma as any, '$transaction').mockResolvedValueOnce([fakeAssign, { id: 'b1', status: 'OCCUPIED' }] as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bedId: 'b1', patientId: 'p1' }) });
    const res: any = await assignmentsRoute.POST(req as any) as any;
    expect((await res.json()).id).toBe('a1');
    expect(auditSpy).toHaveBeenCalled();
  });

  it('POST returns 409 when patient already has an active assignment', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma.bed as any, 'findUnique').mockResolvedValueOnce({ id: 'b1', status: 'AVAILABLE' } as any);
    vi.spyOn(prisma.patient as any, 'findUnique').mockResolvedValueOnce({ id: 'p1' } as any);
    vi.spyOn(prisma.bedAssignment as any, 'findFirst').mockResolvedValueOnce({ id: 'a-existing', patientId: 'p1' } as any);

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ bedId: 'b1', patientId: 'p1' }) });
    const res: any = await assignmentsRoute.POST(req as any) as any;
    expect(res.status).toBe(409);
  });

  it('PATCH discharge sets dischargedAt and makes bed AVAILABLE', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u2' } } } as any);
    const existing = { id: 'a2', bedId: 'b2', dischargedAt: null, bed: { id: 'b2', status: 'OCCUPIED' } } as any;
    vi.spyOn(prisma.bedAssignment as any, 'findUnique').mockResolvedValueOnce(existing as any);
    const updatedAssign = { ...existing, dischargedAt: new Date() } as any;
    vi.spyOn(prisma as any, '$transaction').mockResolvedValueOnce([updatedAssign, { id: 'b2', status: 'AVAILABLE' }] as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const res: any = await dischargeRoute.PATCH(new Request('http://localhost') as any, { params: { id: 'a2' } } as any) as any;
    const json = await res.json();
    expect(json.assignment.dischargedAt).toBeDefined();
    expect(json.bed.status).toBe('AVAILABLE');
    expect(auditSpy).toHaveBeenCalled();
  });
});

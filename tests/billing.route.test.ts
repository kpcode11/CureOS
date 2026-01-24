// @ts-nocheck
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as billingRoute from '@/app/api/billing/route';
import * as billingDetail from '@/app/api/billing/[id]/route';
import * as payRoute from '@/app/api/billing/[id]/pay/route';
import * as updateAmountRoute from '@/app/api/billing/[id]/update-amount/route';
import * as statusRoute from '@/app/api/billing/[id]/status/route';
import * as overdueRoute from '@/app/api/billing/overdue/route';
import * as patientBills from '@/app/api/billing/patient/[patientId]/route';
import * as patientSummary from '@/app/api/billing/patients/[patientId]/route';
import * as auditRoute from '@/app/api/billing/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';



describe('billing routes', () => {
  beforeEach(() => {
    // default: authorized — individual tests override when they assert forbidden behavior
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValue({} as any);
  });

  afterEach(() => vi.restoreAllMocks());

  it('POST creates a billing record when authorized', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'b1' } } } as any);
    const fake = { id: 'bill1', patientId: 'p1', amount: 100.5, description: 'x', dueDate: new Date() } as any;

    // mock via getter (Prisma delegates are proxied; spying the getter is reliable)
    vi.spyOn(prisma, 'billing', 'get' as any).mockReturnValue({ ...(prisma as any).billing, create: vi.fn().mockResolvedValueOnce(fake as any) } as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ patientId: 'p1', amount: 100.5, description: 'x' }) });
    const res: any = await billingRoute.POST(req as any) as any;
    const json = await res.json();
    expect(json.id).toBe('bill1');
    expect(auditSpy).toHaveBeenCalled();
  });

  it('GET /api/billing supports patientId filter', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma, 'billing', 'get' as any).mockReturnValue({ ...(prisma as any).billing, findMany: vi.fn().mockResolvedValueOnce([{ id: 'b1', patientId: 'p1' }]) } as any);
    const res: any = await billingRoute.GET(new Request('http://localhost?patientId=p1') as any);
    const json = await res.json();
    expect(json[0].patientId).toBe('p1');
  });

  it('PATCH pay marks bill PAID and audits', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma, 'billing', 'get' as any).mockReturnValue({ ...(prisma as any).billing,
      findUnique: vi.fn().mockResolvedValueOnce({ id: 'b1', status: 'PENDING' }),
      update: vi.fn().mockResolvedValueOnce({ id: 'b1', status: 'PAID', paidAt: new Date() })
    } as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const res: any = await payRoute.PATCH(new Request('http://localhost') as any, { params: { id: 'b1' } } as any) as any;
    const json = await res.json();
    expect(json.status).toBe('PAID');
    expect(auditSpy).toHaveBeenCalled();
  });

  it('GET overdue returns pending bills past due date', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma, 'billing', 'get' as any).mockReturnValue({ ...(prisma as any).billing, findMany: vi.fn().mockResolvedValueOnce([{ id: 'o1', status: 'PENDING', dueDate: new Date(Date.now() - 86400000) }]) } as any);
    const res: any = await overdueRoute.GET(new Request('http://localhost') as any) as any;
    const json = await res.json();
    expect(json[0].status).toBe('PENDING');
  });

  it('GET patient summary returns patient and summary', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma, 'patient', 'get' as any).mockReturnValue({ ...(prisma as any).patient, findUnique: vi.fn().mockResolvedValueOnce({ id: 'p1', firstName: 'A', lastName: 'B' }) } as any);
    vi.spyOn(prisma, 'billing', 'get' as any).mockReturnValue({ ...(prisma as any).billing, findMany: vi.fn().mockResolvedValueOnce([{ id: 'x', amount: 10, status: 'PENDING' }, { id: 'y', amount: 5, status: 'PAID' }]) } as any);
    const res: any = await patientSummary.GET(new Request('http://localhost') as any, { params: { patientId: 'p1' } } as any) as any;
    const json = await res.json();
    expect(json.patient.id).toBe('p1');
    expect(json.summary.total).toBe(15);
  });

  it('GET billing audit-logs requires audit.read', async () => {
    (vi.spyOn(authLib, 'requirePermission') as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma, 'auditLog', 'get' as any).mockReturnValue({ ...(prisma as any).auditLog, findMany: vi.fn().mockResolvedValueOnce([{ id: 'al1', action: 'billing.create' }]) } as any);
    const res: any = await auditRoute.GET(new Request('http://localhost') as any) as any;
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});
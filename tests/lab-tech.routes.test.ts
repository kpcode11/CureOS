// @ts-nocheck
import { describe, it, expect, vi, afterEach } from 'vitest';

import * as labTestsRoute from '@/app/api/lab-tech/lab-tests/route';
import * as labTestDetailRoute from '@/app/api/lab-tech/lab-tests/[id]/route';
import * as labTestStartRoute from '@/app/api/lab-tech/lab-tests/[id]/start/route';
import * as labTestResultsRoute from '@/app/api/lab-tech/lab-tests/[id]/results/route';
import * as labTestCompleteRoute from '@/app/api/lab-tech/lab-tests/[id]/complete/route';
import * as patientRoute from '@/app/api/lab-tech/patients/[patientId]/route';
import * as patientLabTestsRoute from '@/app/api/lab-tech/patients/[patientId]/lab-tests/route';
import * as auditRoute from '@/app/api/lab-tech/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';

describe('lab-tech API routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lab-tests list / query', () => {
    it('GET list returns 403 when unauthorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res: any = await labTestsRoute.GET(new Request('http://localhost'));
      expect(res.status).toBe(403);
    });

    it('GET list returns rows (default work-queue)', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findMany = vi.fn().mockResolvedValueOnce([
        { id: 'lt1', patientId: 'p1', status: 'PENDING', orderedAt: new Date() },
      ] as any);

      const res: any = await labTestsRoute.GET(new Request('http://localhost'));
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json[0].id).toBe('lt1');
    });

    it('GET list returns 400 for invalid status query', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      const res: any = await labTestsRoute.GET(new Request('http://localhost?status=NOPE'));
      expect(res.status).toBe(400);
    });
  });

  describe('lab-test detail', () => {
    it('GET detail returns 404 when not found', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce(null);

      const res: any = await labTestDetailRoute.GET(new Request('http://localhost'), { params: { id: 'no' } } as any);
      expect(res.status).toBe(404);
    });

    it('GET detail returns labTest with patient info', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt2', patient: { id: 'p1', firstName: 'A' } } as any);

      const res: any = await labTestDetailRoute.GET(new Request('http://localhost'), { params: { id: 'lt2' } } as any);
      const json = await res.json();
      expect(json.id).toBe('lt2');
      expect(json.patient).toHaveProperty('firstName');
    });
  });

  describe('start / results / complete flows', () => {
    it('PATCH start returns 403 when unauthorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res: any = await labTestStartRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'x' } } as any);
      expect(res.status).toBe(403);
    });

    it('PATCH start returns 404 when labTest missing', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce(null);
      const res: any = await labTestStartRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'no' } } as any);
      expect(res.status).toBe(404);
    });

    it('PATCH start returns 409 for invalid status transition', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt3', status: 'IN_PROGRESS' } as any);
      const res: any = await labTestStartRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'lt3' } } as any);
      expect(res.status).toBe(409);
    });

    it('PATCH start transitions to IN_PROGRESS and audits', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'u2' } } } as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt4', status: 'PENDING' } as any);
      (prisma as any).labTech = (prisma as any).labTech ?? {};
      (prisma as any).labTech.findUnique = vi.fn().mockResolvedValueOnce({ id: 'labTech1' } as any);
      (prisma as any).labTest.update = vi.fn().mockResolvedValueOnce({ id: 'lt4', status: 'IN_PROGRESS', labTechId: 'labTech1' } as any);
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const res: any = await labTestStartRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'lt4' } } as any);
      const json = await res.json();
      expect(json.status).toBe('IN_PROGRESS');
      expect(auditSpy).toHaveBeenCalled();
    });

    it('PATCH results validates body and updates results + audits', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValue({ session: { user: { id: 'u3' } } } as any);
      const badReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({}) });
      const badRes: any = await labTestResultsRoute.PATCH(badReq as any, { params: { id: 'x' } } as any);
      expect(badRes.status).toBe(400);

      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt5' } as any);
      (prisma as any).labTest.update = vi.fn().mockResolvedValueOnce({ id: 'lt5', results: { hgb: 12 } } as any);
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const goodReq = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ results: { hgb: 12 }, summary: 'ok' }) });
      const res: any = await labTestResultsRoute.PATCH(goodReq as any, { params: { id: 'lt5' } } as any);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).not.toBeNull();
      expect(json.results).toHaveProperty('hgb');
      expect(auditSpy).toHaveBeenCalled();
    });

    it('PATCH complete returns 409 if already completed and audits on success', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValue({ session: { user: { id: 'u4' } } } as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt6', status: 'COMPLETED' } as any);
      const res1: any = await labTestCompleteRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'lt6' } } as any);
      expect(res1.status).toBe(409);

      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findUnique = vi.fn().mockResolvedValueOnce({ id: 'lt7', status: 'IN_PROGRESS' } as any);
      (prisma as any).labTech = (prisma as any).labTech ?? {};
      (prisma as any).labTech.findUnique = vi.fn().mockResolvedValueOnce({ id: 'labTech2' } as any);
      (prisma as any).labTest.update = vi.fn().mockResolvedValueOnce({ id: 'lt7', status: 'COMPLETED', completedAt: new Date() } as any);
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const res2: any = await labTestCompleteRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'lt7' } } as any);
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.status).toBe('COMPLETED');
      expect(auditSpy).toHaveBeenCalled();
    });
  });

  describe('patient lookups + audit-logs', () => {
    it('GET patient returns 403 when unauthorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res: any = await patientRoute.GET(new Request('http://localhost'), { params: { patientId: 'x' } } as any);
      expect(res.status).toBe(403);
    });

    it('GET patient returns 404 when missing and returns record when present', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValue({} as any);
      (prisma as any).patient = (prisma as any).patient ?? {};
      (prisma as any).patient.findUnique = vi.fn().mockResolvedValueOnce(null);
      const res1: any = await patientRoute.GET(new Request('http://localhost'), { params: { patientId: 'no' } } as any);
      expect(res1.status).toBe(404);

      (prisma as any).patient.findUnique = vi.fn().mockResolvedValueOnce({ id: 'p1', firstName: 'A' } as any);
      const res2: any = await patientRoute.GET(new Request('http://localhost'), { params: { patientId: 'p1' } } as any);
      const json = await res2.json();
      expect(json.id).toBe('p1');
    });

    it('GET patient lab-tests requires permission and returns rows', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      (prisma as any).labTest = (prisma as any).labTest ?? {};
      (prisma as any).labTest.findMany = vi.fn().mockResolvedValueOnce([{ id: 'lt-p1-1' }] as any);
      const res: any = await patientLabTestsRoute.GET(new Request('http://localhost'), { params: { patientId: 'p1' } } as any);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json[0].id).toBe('lt-p1-1');
    });

    it('GET audit-logs enforces permission and returns rows', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res1: any = await auditRoute.GET(new Request('http://localhost'));
      expect(res1.status).toBe(403);

      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      (prisma as any).auditLog = (prisma as any).auditLog ?? {};
      (prisma as any).auditLog.findMany = vi.fn().mockResolvedValueOnce([{ id: 'a1', action: 'labtest.start' }] as any);
      const res2: any = await auditRoute.GET(new Request('http://localhost?resource=LabTest'));
      const json = await res2.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json[0].action).toBe('labtest.start');
    });
  });
});

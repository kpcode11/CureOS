// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as prescriptionsRoute from '@/app/api/pharmacist/prescriptions/route';
import * as prescriptionDetailRoute from '@/app/api/pharmacist/prescriptions/[id]/route';
import * as dispenseRoute from '@/app/api/pharmacist/prescriptions/[id]/dispense/route';
import * as undoDispenseRoute from '@/app/api/pharmacist/prescriptions/[id]/undo-dispense/route';
import * as noteRoute from '@/app/api/pharmacist/prescriptions/[id]/note/route';
import * as emrRoute from '@/app/api/pharmacist/patients/[patientId]/emr/route';
import * as inventoryRoute from '@/app/api/pharmacist/inventory/route';
import * as inventoryDeductRoute from '@/app/api/pharmacist/inventory/[id]/deduct/route';
import * as auditRoute from '@/app/api/pharmacist/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';

describe('pharmacist API routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('prescriptions list + detail', () => {
    it('GET list returns 403 when unauthorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res: any = await prescriptionsRoute.GET(new Request('http://localhost'));
      expect(res.status).toBe(403);
    });

    it('GET list returns prescriptions when authorized (filtered)', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.prescription, 'findMany' as any).mockResolvedValueOnce([
        { id: 'p1', patientId: 'pat1', doctorId: 'd1', dispensed: false, dispensedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ] as any);

      const res: any = await prescriptionsRoute.GET(new Request('http://localhost?dispensed=false'));
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json[0].id).toBe('p1');
    });

    it('GET detail returns 404 when not found', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.prescription, 'findUnique' as any).mockResolvedValueOnce(null);

      const res: any = await prescriptionDetailRoute.GET(new Request('http://localhost'), { params: { id: 'no' } } as any);
      expect(res.status).toBe(404);
    });

    it('GET detail returns prescription with doctor+patient info', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.prescription, 'findUnique' as any).mockResolvedValueOnce({
        id: 'p2',
        medications: [{ name: 'x' }],
        instructions: 'take once',
        dispensed: false,
        dispensedAt: null,
        patient: { id: 'pat1', firstName: 'A', lastName: 'B', phone: '123', email: null, dateOfBirth: new Date() },
        doctor: { id: 'd1', specialization: 'med', user: { id: 'u1', name: 'Dr A', email: 'a@x' } },
      } as any);

      const res: any = await prescriptionDetailRoute.GET(new Request('http://localhost'), { params: { id: 'p2' } } as any);
      const json = await res.json();
      expect(json.id).toBe('p2');
      expect(json.patient).toHaveProperty('firstName');
      expect(json.doctor).toHaveProperty('user');
    });
  });

  describe('dispense / undo / note', () => {
    it('PATCH dispense marks prescription dispensed and creates audit', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'ph1' } } } as any);
      vi.spyOn(prisma.prescription, 'findUnique' as any).mockResolvedValueOnce({ id: 'p3', dispensed: false } as any);
      vi.spyOn(prisma, '$transaction' as any).mockImplementationOnce(async (fn: any) => {
        const fakeTx = {
          prescription: {
            update: vi.fn().mockResolvedValueOnce({ id: 'p3', dispensed: true, pharmacistId: 'ph1', dispensedAt: new Date() }),
          },
        } as any;
        return fn(fakeTx);
      });
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const res: any = await dispenseRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'p3' } } as any);
      const json = await res.json();
      expect(json.dispensed).toBe(true);
      expect(auditSpy).toHaveBeenCalled();
    });

    it('PATCH undo-dispense reverts dispensed and creates audit', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValue({ session: { user: { id: 'ph1' } } } as any);
      vi.spyOn(prisma.prescription, 'findUnique' as any).mockResolvedValueOnce({ id: 'p4', dispensed: true, pharmacistId: 'ph1' } as any);
      vi.spyOn(prisma, '$transaction' as any).mockImplementationOnce(async (fn: any) => {
        const fakeTx = {
          prescription: {
            update: vi.fn().mockResolvedValueOnce({ id: 'p4', dispensed: false, pharmacistId: null }),
          },
        } as any;
        return fn(fakeTx);
      });
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const res: any = await undoDispenseRoute.PATCH(new Request('http://localhost', { method: 'PATCH' }), { params: { id: 'p4' } } as any);
      const json = await res.json();
      expect(json.dispensed).toBe(false);
      expect(auditSpy).toHaveBeenCalled();
    });

    it('PATCH note writes pharmacistNotes and audits', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'ph1' } } } as any);
      vi.spyOn(prisma.prescription, 'findUnique' as any).mockResolvedValueOnce({ id: 'p5', pharmacistNotes: null } as any);
      vi.spyOn(prisma.prescription, 'update' as any).mockResolvedValueOnce({ id: 'p5', pharmacistNotes: 'ok' } as any);
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const req = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ note: 'ok' }) });
      const res: any = await noteRoute.PATCH(req, { params: { id: 'p5' } } as any);
      const json = await res.json();
      expect(json.pharmacistNotes).toBe('ok');
      expect(auditSpy).toHaveBeenCalled();
    });
  });

  describe('EMR access', () => {
    it('GET patient EMR returns 403 when unauthorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
      const res: any = await emrRoute.GET(new Request('http://localhost'), { params: { patientId: 'x' } } as any);
      expect(res.status).toBe(403);
    });

    it('GET patient EMR returns records when authorized', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.eMR, 'findMany' as any).mockResolvedValueOnce([{ id: 'e1', diagnosis: 'd', symptoms: 's', vitals: {}, notes: null, createdAt: new Date() }] as any);
      const res: any = await emrRoute.GET(new Request('http://localhost'), { params: { patientId: 'pat1' } } as any);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json[0].diagnosis).toBe('d');
    });
  });

  describe('inventory & audit', () => {
    it('GET inventory requires permission and returns rows', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.inventory, 'findMany' as any).mockResolvedValueOnce([{ id: 'i1', itemName: 'drug', quantity: 5, minStock: 2 }] as any);
      const res: any = await inventoryRoute.GET(new Request('http://localhost'));
      const json = await res.json();
      expect(json[0].itemName).toBe('drug');
    });

    it('PATCH inventory/:id/deduct checks stock and audits', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'ph1' } } } as any);
      vi.spyOn(prisma.inventory, 'findUnique' as any).mockResolvedValueOnce({ id: 'i1', quantity: 5, minStock: 1 } as any);
      vi.spyOn(prisma, '$transaction' as any).mockImplementationOnce(async (fn: any) => {
        const fakeTx = {
          inventory: {
            update: vi.fn().mockResolvedValueOnce({ id: 'i1', quantity: 3 }),
          },
        } as any;
        return fn(fakeTx);
      });
      const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

      const req = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ quantity: 2 }) });
      const res: any = await inventoryDeductRoute.PATCH(req, { params: { id: 'i1' } } as any);
      const json = await res.json();
      expect(json.quantity).toBe(3);
      expect(auditSpy).toHaveBeenCalled();
    });

    it('GET audit-logs requires audit.read and returns rows+count', async () => {
      vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.auditLog, 'findMany' as any).mockResolvedValueOnce([{ id: 'a1', action: 'prescription.dispense' }] as any);
      vi.spyOn(prisma.auditLog, 'count' as any).mockResolvedValueOnce(1 as any);

      const res: any = await auditRoute.GET(new Request('http://localhost'));
      const json = await res.json();
      expect(json.count).toBe(1);
      expect(Array.isArray(json.rows)).toBe(true);
    });
  });
});

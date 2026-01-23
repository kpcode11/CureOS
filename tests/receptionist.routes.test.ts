// @ts-nocheck
import { describe, it, expect, vi, afterEach } from 'vitest';

import * as patientsRoute from '@/app/api/receptionist/patients/route';
import * as patientDetailRoute from '@/app/api/receptionist/patients/[id]/route';
import * as appointmentsRoute from '@/app/api/receptionist/appointments/route';
import * as appointmentDetailRoute from '@/app/api/receptionist/appointments/[id]/route';
import * as appointmentStatusRoute from '@/app/api/receptionist/appointments/[id]/status/route';
import * as todayRoute from '@/app/api/receptionist/appointments/today/route';
import * as doctorsRoute from '@/app/api/receptionist/doctors/route';
import * as auditRoute from '@/app/api/receptionist/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import * as auditService from '@/services/audit.service';

describe('receptionist API routes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /patients returns 403 when unauthorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockRejectedValueOnce(new Error('no'));
    const res: any = await patientsRoute.GET(new Request('http://localhost'));
    expect(res.status).toBe(403);
  });

  it('POST /patients creates patient and audits', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'u1' } } } as any);
    vi.spyOn(prisma.patient, 'create' as any).mockResolvedValueOnce({ id: 'pat1', firstName: 'A', lastName: 'B' } as any);
    const auditSpy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ firstName: 'A', lastName: 'B', phone: '123', gender: 'male', dateOfBirth: '1990-01-01' }) });
    const res: any = await patientsRoute.POST(req as any);
    const json = await res.json();
    expect(json.id).toBe('pat1');
    expect(auditSpy).toHaveBeenCalled();
  });

  it('POST /appointments schedules and audits', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'rec1' } } } as any);
    vi.spyOn(prisma.receptionist, 'findUnique' as any).mockResolvedValueOnce({ id: 'r1' } as any);
    vi.spyOn(prisma.appointment, 'create' as any).mockResolvedValueOnce({ id: 'a1', patientId: 'pat1', doctorId: 'd1' } as any);
    const spy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ patientId: 'pat1', doctorId: 'd1', dateTime: new Date().toISOString(), reason: 'checkup' }) });
    const res: any = await appointmentsRoute.POST(req as any);
    const json = await res.json();
    expect(json.id).toBe('a1');
    expect(spy).toHaveBeenCalled();
  });

  it('GET /appointments/today returns rows when authorized', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.appointment, 'findMany' as any).mockResolvedValueOnce([{ id: 'a-today' }] as any);

    const res: any = await todayRoute.GET(new Request('http://localhost'));
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].id).toBe('a-today');
  });

  it('PATCH /appointments/:id/status updates status and audits', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({ session: { user: { id: 'rec1' } } } as any);
    vi.spyOn(prisma.appointment, 'findUnique' as any).mockResolvedValueOnce({ id: 'a2', status: 'SCHEDULED' } as any);
    vi.spyOn(prisma.appointment, 'update' as any).mockResolvedValueOnce({ id: 'a2', status: 'COMPLETED' } as any);
    const spy = vi.spyOn(auditService, 'createAudit' as any).mockResolvedValueOnce({} as any);

    const req = new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
    const res: any = await appointmentStatusRoute.PATCH(req as any, { params: { id: 'a2' } } as any);
    const json = await res.json();
    expect(json.status).toBe('COMPLETED');
    expect(spy).toHaveBeenCalled();
  });

  it('GET /doctors returns list', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.doctor, 'findMany' as any).mockResolvedValueOnce([{ id: 'd1', user: { id: 'u1', name: 'Dr X' } }] as any);

    const res: any = await doctorsRoute.GET(new Request('http://localhost'));
    const json = await res.json();
    expect(json[0].id).toBe('d1');
  });

  it('GET /audit-logs requires audit.read and returns rows+count', async () => {
    vi.spyOn(authLib, 'requirePermission' as any).mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.auditLog, 'findMany' as any).mockResolvedValueOnce([{ id: 'al1', action: 'receptionist.patient.create' }] as any);
    vi.spyOn(prisma.auditLog, 'count' as any).mockResolvedValueOnce(1 as any);

    const res: any = await auditRoute.GET(new Request('http://localhost'));
    const json = await res.json();
    expect(json.count).toBe(1);
    expect(Array.isArray(json.rows)).toBe(true);
  });
});

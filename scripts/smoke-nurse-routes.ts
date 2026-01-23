/* smoke-nurse-routes.ts — quick runtime checks for nurse route handlers
   - Mocks `requirePermission` and `prisma` methods used by the handlers
   - Executes each handler and asserts expected shape/status
*/
import assert from 'assert';

// import modules under test
import * as bedsRoute from '@/app/api/nurse/beds/route';
import * as bedsAvailableRoute from '@/app/api/nurse/beds/available/route';
import * as bedStatusRoute from '@/app/api/nurse/beds/[bedId]/status/route';
import * as assignmentsRoute from '@/app/api/nurse/bed-assignments/route';
import * as dischargeRoute from '@/app/api/nurse/bed-assignments/[id]/discharge/route';
import * as patientsRoute from '@/app/api/nurse/patients/[patientId]/route';
import * as patientBedRoute from '@/app/api/nurse/patients/[patientId]/bed/route';
import * as emrRoute from '@/app/api/nurse/patients/[patientId]/emr/route';
import * as labRoute from '@/app/api/nurse/patients/[patientId]/lab-tests/route';
import * as nursingRecordsRoute from '@/app/api/nurse/nursing-records/route';
import * as wardAssignmentsRoute from '@/app/api/nurse/ward/assignments/route';
import * as auditLogsRoute from '@/app/api/nurse/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// helpers
const jsonRequest = (body?: any) => new Request('http://localhost', { method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined });

async function run() {
  // stub authorization to an authorized nurse by default
  (authLib as any).requirePermission = async (req: any, perm: string) => {
    if (perm === 'beds.update' || perm === 'nursing.create') {
      return { session: { user: { id: 'u-nurse' } } } as any;
    }
    return {} as any;
  };

  // ---- beds list ----
  (prisma.bed as any).findMany = async (opts: any) => [ { id: 'b1', bedNumber: '1', ward: 'A', bedType: 'standard', status: 'AVAILABLE' } ];
  let res: any = await bedsRoute.GET(jsonRequest());
  let j = await res.json();
  assert(Array.isArray(j) && j.length > 0 && j[0].bedNumber === '1');

  // ---- available beds ----
  (prisma.bed as any).findMany = async (opts: any) => [ { id: 'b1', bedNumber: '1', ward: 'A', bedType: 'standard', status: 'AVAILABLE' } ];
  res = await bedsAvailableRoute.GET(jsonRequest());
  j = await res.json();
  assert(j.every((x: any) => x.status === 'AVAILABLE'));

  // ---- update bed status (PATCH) ----
  (prisma.bed as any).findUnique = async (q: any) => ({ id: 'b1', status: 'AVAILABLE' });
  (prisma.bed as any).update = async (q: any) => ({ id: 'b1', status: q.data.status });
  res = await bedStatusRoute.PATCH(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ status: 'MAINTENANCE' }) }) as any, { params: { bedId: 'b1' } } as any);
  j = await res.json();
  assert(j.status === 'MAINTENANCE');

  // ---- create bed-assignment (POST) ----
  (prisma.bed as any).findUnique = async (q: any) => ({ id: 'b1', status: 'AVAILABLE' });
  (prisma.nurse as any).findUnique = async (q: any) => ({ id: 'n1' });
  const fakeAssign = { id: 'a1', bedId: 'b1', patientId: 'p1', nurseId: 'n1' };
  (prisma as any).$transaction = async (ops: any[]) => [ fakeAssign, { id: 'b1', status: 'OCCUPIED' } ];

  res = await assignmentsRoute.POST(jsonRequest({ bedId: 'b1', patientId: 'p1' }) as any);
  j = await res.json();
  assert(j.id === 'a1');

  // ---- list active assignments ----
  (prisma.bedAssignment as any).findMany = async (opts: any) => [ fakeAssign ];
  res = await assignmentsRoute.GET(jsonRequest());
  j = await res.json();
  assert(Array.isArray(j));

  // ---- discharge assignment ----
  const existing = { id: 'a2', bedId: 'b2', dischargedAt: null, bed: { id: 'b2', status: 'OCCUPIED' } };
  (prisma.bedAssignment as any).findUnique = async (q: any) => existing;
  (prisma as any).$transaction = async (ops: any[]) => [ { ...existing, dischargedAt: new Date() }, { id: 'b2', status: 'AVAILABLE' } ];
  res = await dischargeRoute.PATCH(jsonRequest() as any, { params: { id: 'a2' } } as any);
  j = await res.json();
  assert(j.assignment.dischargedAt);
  assert(j.bed.status === 'AVAILABLE');

  // ---- patient basic info ----
  (prisma.patient as any).findUnique = async (q: any) => ({ id: 'p1', firstName: 'A', lastName: 'B', dateOfBirth: new Date(), gender: 'F', phone: 'x' });
  res = await patientsRoute.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(j.id === 'p1');

  // ---- patient bed ----
  (prisma.bedAssignment as any).findFirst = async (q: any) => ({ id: 'a1', bedId: 'b1', patientId: 'p1', bed: { id: 'b1', bedNumber: '1' } });
  res = await patientBedRoute.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(j.bed && j.patientId === 'p1');

  // ---- EMR and lab-tests (read-only) ----
  (prisma.eMR as any).findMany = async (q: any) => [{ id: 'e1', diagnosis: 'X' }];
  res = await emrRoute.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(Array.isArray(j));

  (prisma.labTest as any).findMany = async (q: any) => [{ id: 'lt1', testType: 'CBC' }];
  res = await labRoute.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(Array.isArray(j));

  // ---- nursing records GET/POST ----
  (prisma.nursingRecord as any).findMany = async (q: any) => [{ id: 'nr1', nurseId: 'n1', vitals: {} }];
  res = await nursingRecordsRoute.GET(new Request('http://localhost?patientName=foo') as any);
  j = await res.json();
  assert(Array.isArray(j));

  (prisma.nursingRecord as any).create = async (q: any) => ({ id: 'nr2', ...q.data });
  res = await nursingRecordsRoute.POST(jsonRequest({ nurseId: 'n1', patientName: 'p1', vitals: { bp: '120/80' } }) as any);
  j = await res.json();
  assert(j.id === 'nr2');

  // ---- ward assignments ----
  (prisma.nurse as any).findUnique = async (q: any) => ({ id: 'n1', department: 'Ward A' });
  (prisma.bedAssignment as any).findMany = async (q: any) => [ { id: 'a1', bed: { ward: 'Ward A' }, patient: { id: 'p1' } } ];
  res = await wardAssignmentsRoute.GET(new Request('http://localhost') as any);
  j = await res.json();
  assert(Array.isArray(j));

  // ---- audit logs ----
  (prisma.auditLog as any).findMany = async (q: any) => [ { id: 'al1', action: 'bed.assign' } ];
  res = await auditLogsRoute.GET(new Request('http://localhost') as any);
  j = await res.json();
  assert(Array.isArray(j));

  console.log('SMOKE: all nurse route handlers returned expected responses ✅');
}

run().catch(err => {
  console.error('SMOKE FAILED —', err);
  process.exitCode = 2;
});

/* smoke-billing-routes.ts — runtime checks for billing route handlers
   Mocks `requirePermission` and `prisma` methods used by the handlers
   Executes each handler and asserts expected shape/status
*/
import assert from 'assert';

import * as billingRoute from '@/app/api/billing/route';
import * as billingDetail from '@/app/api/billing/[id]/route';
import * as payRoute from '@/app/api/billing/[id]/pay/route';
import * as updateAmountRoute from '@/app/api/billing/[id]/update-amount/route';
import * as statusRoute from '@/app/api/billing/[id]/status/route';
import * as overdueRoute from '@/app/api/billing/overdue/route';
import * as patientBills from '@/app/api/billing/patient/[patientId]/route';
import * as patientSummary from '../src/app/api/billing/patients/[patientId]/route';
import * as auditRoute from '@/app/api/billing/audit-logs/route';

import * as authLib from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

const jsonRequest = (method = 'GET', body?: any) => new Request('http://localhost', { method, body: body ? JSON.stringify(body) : undefined });

async function run() {
  // authorize
  (authLib as any).requirePermission = async () => ({});

  // POST create
  const fake = { id: 'bill1', patientId: 'p1', amount: 10, description: 'x', dueDate: new Date() };
  (prisma.billing as any).create = async () => fake;
  let res: any = await billingRoute.POST(jsonRequest('POST', { patientId: 'p1', amount: 10, description: 'x' }) as any);
  let j = await res.json();
  assert(j.id === 'bill1');

  // GET list with filter
  (prisma.billing as any).findMany = async (opts: any) => [{ id: 'b1', patientId: 'p1' }];
  res = await billingRoute.GET(jsonRequest() as any);
  j = await res.json();
  assert(Array.isArray(j));

  // GET by id
  (prisma.billing as any).findUnique = async (q: any) => ({ id: 'b1', patientId: 'p1', amount: 5 });
  res = await billingDetail.GET(jsonRequest() as any, { params: { id: 'b1' } } as any);
  j = await res.json();
  assert(j.id === 'b1');

  // PATCH pay
  (prisma.billing as any).findUnique = async () => ({ id: 'b2', status: 'PENDING' });
  (prisma.billing as any).update = async (q: any) => ({ id: 'b2', status: 'PAID', paidAt: new Date() });
  res = await payRoute.PATCH(jsonRequest('PATCH') as any, { params: { id: 'b2' } } as any);
  j = await res.json();
  assert(j.status === 'PAID');

  // PATCH update-amount (allowed)
  (prisma.billing as any).findUnique = async () => ({ id: 'b3', status: 'PENDING', amount: 20 });
  (prisma.billing as any).update = async (q: any) => ({ id: 'b3', status: 'PENDING', amount: q.data.amount });
  res = await updateAmountRoute.PATCH(jsonRequest('PATCH', { amount: 15 }) as any, { params: { id: 'b3' } } as any);
  j = await res.json();
  assert(j.amount === 15);

  // PATCH update-amount (blocked when PAID)
  (prisma.billing as any).findUnique = async () => ({ id: 'b4', status: 'PAID', amount: 10 });
  res = await updateAmountRoute.PATCH(jsonRequest('PATCH', { amount: 5 }) as any, { params: { id: 'b4' } } as any);
  assert(res.status === 409);

  // PATCH status
  (prisma.billing as any).findUnique = async () => ({ id: 'b5', status: 'PENDING' });
  (prisma.billing as any).update = async (q: any) => ({ id: 'b5', status: q.data.status });
  res = await statusRoute.PATCH(jsonRequest('PATCH', { status: 'CANCELLED' }) as any, { params: { id: 'b5' } } as any);
  j = await res.json();
  assert(j.status === 'CANCELLED');

  // GET overdue
  (prisma.billing as any).findMany = async () => [{ id: 'o1', status: 'PENDING', dueDate: new Date(Date.now() - 86400000) }];
  res = await overdueRoute.GET(jsonRequest() as any);
  j = await res.json();
  assert(Array.isArray(j) && j[0].status === 'PENDING');

  // GET patient bills
  (prisma.billing as any).findMany = async () => [{ id: 'pb1', patientId: 'p1' }];
  res = await patientBills.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(Array.isArray(j));

  // GET patient summary
  (prisma.patient as any).findUnique = async () => ({ id: 'p1', firstName: 'A', lastName: 'B' });
  (prisma.billing as any).findMany = async () => [{ id: 'x', amount: 10, status: 'PENDING' }, { id: 'y', amount: 5, status: 'PAID' }];
  res = await patientSummary.GET(jsonRequest() as any, { params: { patientId: 'p1' } } as any);
  j = await res.json();
  assert(j.summary.total === 15);

  // GET audit logs
  (prisma.auditLog as any).findMany = async () => [{ id: 'al1', action: 'billing.create' }];
  res = await auditRoute.GET(jsonRequest() as any);
  j = await res.json();
  assert(Array.isArray(j));

  console.log('SMOKE: billing routes OK ✅');
}

run().catch(err => {
  console.error('SMOKE FAILED —', err);
  process.exitCode = 2;
});
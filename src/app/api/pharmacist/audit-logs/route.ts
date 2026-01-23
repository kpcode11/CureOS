import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

// GET /api/pharmacist/audit-logs?take=50&skip=0
export async function GET(req: Request) {
  try {
    await requirePermission(req, 'audit.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get('take') ?? 100), 500);
  const skip = Number(url.searchParams.get('skip') ?? 0);

  // limit to pharmacy-related audit entries for safety
  const where = {
    OR: [
      { action: { contains: 'prescription.' } },
      { action: { contains: 'inventory.' } },
      { resource: 'Prescription' },
      { resource: 'Inventory' },
    ],
  } as any;

  const [rows, count] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ rows, count });
}
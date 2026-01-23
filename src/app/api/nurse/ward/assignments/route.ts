import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const res = await requirePermission(req, 'beds.read');
    const userId = res.session?.user?.id ?? null;

    // try to resolve nurse's department from session; allow ?department= override for admins/tests
    const url = new URL(req.url);
    const deptOverride = url.searchParams.get('department');

    let department: string | null = deptOverride;
    if (!department && userId) {
      const nurse = await prisma.nurse.findUnique({ where: { userId } });
      department = nurse?.department ?? null;
    }

    if (!department) return NextResponse.json({ error: 'department not resolvable' }, { status: 400 });

    const rows = await prisma.bedAssignment.findMany({ where: { dischargedAt: null, bed: { ward: department } }, include: { bed: true, patient: true, nurse: true }, orderBy: { assignedAt: 'asc' } });
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

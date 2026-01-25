import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'beds.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.bedAssignment.findMany({ where: { dischargedAt: null }, include: { bed: true, patient: true, nurse: { select: { id: true, department: true } } }, orderBy: { assignedAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'beds.update');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    const { bedId, patientId } = body || {};
    if (!bedId || !patientId) return NextResponse.json({ error: 'bedId and patientId required' }, { status: 400 });

    // ensure bed exists and is available
    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) return NextResponse.json({ error: 'bed not found' }, { status: 404 });
    if (bed.status !== 'AVAILABLE') return NextResponse.json({ error: 'bed not available' }, { status: 409 });

    // validate patient exists and is not already admitted
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return NextResponse.json({ error: 'patient not found' }, { status: 404 });
    const existingAssignment = await prisma.bedAssignment.findFirst({ where: { patientId, dischargedAt: null } });
    if (existingAssignment) return NextResponse.json({ error: 'patient already assigned to a bed' }, { status: 409 });

    // resolve nurse entity from session if present
    const userId = res.session?.user?.id ?? null;
    const nurse = userId ? await prisma.nurse.findUnique({ where: { userId } }) : null;

    const [assignment] = await prisma.$transaction([
      prisma.bedAssignment.create({ data: { bedId, patientId, nurseId: nurse?.id ?? undefined } }),
      prisma.bed.update({ where: { id: bedId }, data: { status: 'OCCUPIED' } })
    ]);

    // Create billing for bed assignment (₹1000 per day)
    const bedCharge = 1000;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due next day

    await prisma.billing.create({
      data: {
        patientId,
        amount: bedCharge,
        description: `Bed Assignment - ${bed.bedNumber} (${bed.ward})`,
        status: 'PENDING',
        dueDate: dueDate,
      },
    });

    await createAudit({ actorId, action: 'bed.assign', resource: 'BedAssignment', resourceId: assignment.id, after: assignment, meta: { bedCharge } });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

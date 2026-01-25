import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'lab.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const rows = await prisma.labTest.findMany({ take: 200, orderBy: { orderedAt: 'desc' } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const res = await requirePermission(req, 'lab.create');
    const actorId = res.session?.user?.id ?? null;
    const body = await req.json();
    
    // Create lab test and billing in transaction
    const rec = await prisma.$transaction(async (tx) => {
      const labTest = await tx.labTest.create({ 
        data: { 
          patientId: body.patientId, 
          testType: body.testType,
          priority: body.priority || 'ROUTINE',
          instructions: body.instructions || null,
        } 
      });

      // Create billing for lab test (₹500 base cost)
      const labTestCost = 500;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

      await tx.billing.create({
        data: {
          patientId: body.patientId,
          amount: labTestCost,
          description: `Lab Test - ${body.testType}`,
          status: 'PENDING',
          dueDate: dueDate,
        },
      });

      return labTest;
    });

    await createAudit({ 
      actorId, 
      action: 'labtest.order', 
      resource: 'LabTest', 
      resourceId: rec.id, 
      meta: { patientId: rec.patientId, testType: rec.testType, cost: 500 } 
    });
    return NextResponse.json(rec);
  } catch (err) {
    console.error('Lab test creation error:', err);
    return NextResponse.json({ error: 'Failed to create lab test' }, { status: 500 });
  }
}
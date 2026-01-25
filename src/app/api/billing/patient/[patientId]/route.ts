import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { patientId: string } }) {
  try {
    await requirePermission(req, 'billing.read');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { patientId } = await params;
    const rows = await prisma.billing.findMany({ 
      where: { patientId }, 
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    // Format patient data to match frontend expectations
    const formattedRows = rows.map(row => ({
      ...row,
      patient: row.patient ? {
        name: `${row.patient.firstName} ${row.patient.lastName}`,
        mrn: row.patient.id
      } : undefined
    }));
    
    return NextResponse.json(formattedRows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('billing.patient.GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
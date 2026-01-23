import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { prisma } from '@/lib/prisma';
import { createAudit } from '@/services/audit.service';

// PATCH /api/pharmacist/prescriptions/:id/note
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const res = await requirePermission(req, 'pharmacy.read');
    const actorId = res.session?.user?.id ?? null;
    const { id } = await params;
    const body = await req.json();
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (!note) return NextResponse.json({ error: 'note is required' }, { status: 400 });

    const existing = await prisma.prescription.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // persist to prescription.pharmacistNotes (non-destructive) and create an audit trail
    const updated = await prisma.prescription.update({ where: { id }, data: { pharmacistNotes: note } });
    await createAudit({ actorId, action: 'prescription.note', resource: 'Prescription', resourceId: id, before: { pharmacistNotes: existing.pharmacistNotes ?? null }, after: { pharmacistNotes: note }, meta: { note } });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
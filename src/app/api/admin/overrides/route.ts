import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { listEmergencyOverrides, expireEmergencyOverride } from '@/services/auth.service';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'audit.read');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const q = new URL(req.url).searchParams;
  const onlyActive = q.get('onlyActive') === '1' || q.get('onlyActive') === 'true';
  const list = await listEmergencyOverrides({ onlyActive });
  return NextResponse.json(list);
}

export async function DELETE(req: Request) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'roles.manage');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const q = new URL(req.url).searchParams;
  const id = q.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    const expired = await expireEmergencyOverride(id, session?.user?.id);
    await createAudit({ actorId: session?.user?.id ?? null, action: 'emergency.override.expire', resource: 'EmergencyOverride', resourceId: id });
    return NextResponse.json(expired);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { listPermissions, ensurePermissions } from '@/services/permission.service';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(req, 'admin.permissions.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const perms = await listPermissions();
  return NextResponse.json(perms);
}

export async function POST(req: Request) {
  try {
    await requirePermission(req, 'admin.permissions.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { names } = await req.json();
  if (!Array.isArray(names)) return NextResponse.json({ error: 'names[] required' }, { status: 400 });
  const out = await ensurePermissions(names);
  await createAudit({ action: 'permission.bulkCreate', resource: 'Permission', actorId: null, meta: { names } });
  return NextResponse.json(out);
}

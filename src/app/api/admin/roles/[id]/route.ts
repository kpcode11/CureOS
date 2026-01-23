import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { getRole, updateRole, deleteRole } from '@/services/role.service';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(req, 'admin.roles.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const role = await getRole(params.id);
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(role);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'admin.roles.manage');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { name, permissions } = body;
  try {
    const updated = await updateRole(params.id, { name, permissionNames: permissions });
    await createAudit({ actorId: session?.user?.id ?? null, action: 'role.update', resource: 'RoleEntity', resourceId: params.id, meta: { name, permissions } });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'admin.roles.manage');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    await deleteRole(params.id);
    await createAudit({ actorId: session?.user?.id ?? null, action: 'role.delete', resource: 'RoleEntity', resourceId: params.id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authorization';
import { listRoles, createRole, assignPermissions } from '@/services/role.service';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request) {
  try {
    await requirePermission(undefined, 'roles.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const roles = await listRoles();
  return NextResponse.json(roles);
}

export async function POST(req: Request) {
  try {
    await requirePermission(undefined, 'roles.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const { name, permissions = [] } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const role = await createRole(name, permissions);
  await createAudit({ action: 'role.create', resource: 'RoleEntity', resourceId: role?.id ?? null, actorId: null, meta: { name, permissions } });
  return NextResponse.json(role);
}

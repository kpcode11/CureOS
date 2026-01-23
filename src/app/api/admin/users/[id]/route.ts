import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createAudit } from '@/services/audit.service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requirePermission(undefined, 'users.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, email: true, name: true, role: true, roleEntityId: true, createdAt: true } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'users.manage');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.email) data.email = body.email;
  if (body.roleEntityId) data.roleEntityId = body.roleEntityId;
  if (body.password) data.password = await bcrypt.hash(body.password, 10);
  try {
    const updated = await prisma.user.update({ where: { id: params.id }, data, select: { id: true, email: true, name: true, roleEntityId: true } });
    await createAudit({ actorId: session?.user?.id ?? null, action: 'user.update', resource: 'User', resourceId: params.id, meta: { changes: Object.keys(data) } });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  let session: any = null;
  try {
    const res = await requirePermission(req, 'users.manage');
    session = res.session;
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (session?.user?.id === params.id) return NextResponse.json({ error: 'Cannot delete self' }, { status: 400 });
  try {
    await prisma.user.delete({ where: { id: params.id } });
    await createAudit({ actorId: session?.user?.id ?? null, action: 'user.delete', resource: 'User', resourceId: params.id });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'error' }, { status: 400 });
  }
}

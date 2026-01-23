import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';
import { createAudit } from '@/services/audit.service';

export async function GET() {
  try {
    await requirePermission(undefined, 'users.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, roleEntityId: true, createdAt: true } });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    await requirePermission(undefined, 'users.manage');
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { email, password, name, role, roleEntityId } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'email & password required' }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name: name ?? '', role: role ?? 'RECEPTIONIST', roleEntityId } });
  await createAudit({ actorId: null, action: 'user.create', resource: 'User', resourceId: user.id, meta: { email, role, roleEntityId } });
  return NextResponse.json({ id: user.id, email: user.email });
}

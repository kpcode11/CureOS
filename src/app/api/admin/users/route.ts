import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { createAudit } from "@/services/audit.service";

export async function GET(req: Request) {
  try {
    await requirePermission(req, "admin.users.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      roleEntityId: true,
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    await requirePermission(req, "admin.users.create");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { email, password, name, role, roleEntityId } = body ?? {};
  if (!email || !password) return NextResponse.json({ error: 'email & password required' }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);

  // Helper: normalize/match incoming role names to the Prisma `Role` enum
  const ROLE_ENUM = ['DOCTOR','NURSE','PHARMACIST','LAB_TECH','RECEPTIONIST','ADMIN','BILLING_OFFICER','EMERGENCY'] as const;
  function mapToEnumRole(input?: unknown): (typeof ROLE_ENUM)[number] | null {
    if (!input || typeof input !== 'string') return null;
    const s = input.trim().toUpperCase().replace(/[\-\s]+/g, '_').replace(/[^A-Z0-9_]/g, '');
    // common synonyms
    if (s === 'ADMINISTRATOR' || s === 'ADMIN') return 'ADMIN';
    if (s === 'LABTECH' || s === 'LAB_TECH') return 'LAB_TECH';
    if (s === 'BILLING' || s === 'BILLING_OFFICER') return 'BILLING_OFFICER';
    if (s === 'RECEPTION' || s === 'RECEPTIONIST') return 'RECEPTIONIST';
    if (ROLE_ENUM.includes(s as any)) return s as any;
    return null;
  }

  // Resolve role (accepts enum value, friendly variants, or roleEntityId)
  let finalRole: (typeof ROLE_ENUM)[number] | undefined = undefined;
  let finalRoleEntityId: string | undefined = roleEntityId ?? undefined;

  // 1) If explicit role provided — normalize & validate
  if (role) {
    const mapped = mapToEnumRole(role);
    if (!mapped) {
      return NextResponse.json({ error: `invalid role; allowed: ${ROLE_ENUM.join(', ')}` }, { status: 400 });
    }
    finalRole = mapped;
  }

  // 2) If roleEntityId given but role not provided — try to infer a valid enum role
  if (finalRoleEntityId && !finalRole) {
    const re = await prisma.roleEntity.findUnique({ where: { id: finalRoleEntityId }, select: { name: true } });
    if (re) {
      const mapped = mapToEnumRole(re.name);
      if (mapped) {
        finalRole = mapped;
      } else {
        // Unknown mapping: log and fall back to default below (do NOT set an invalid enum)
        console.warn(`Unmappable RoleEntity.name -> Role enum: ${re.name} (id=${finalRoleEntityId})`);
      }
    }
  }

  // 3) If role provided but roleEntityId missing — try to look up roleEntityId by name (case-insensitive)
  if (!finalRoleEntityId && finalRole) {
    const re = await prisma.roleEntity.findFirst({ where: { name: { equals: finalRole, mode: 'insensitive' } }, select: { id: true } });
    if (re) finalRoleEntityId = re.id;
  }

  // 4) Default role
  if (!finalRole) finalRole = 'RECEPTIONIST';

  // Create user with robust error handling and clear JSON errors (prevents front-end JSON.parse failures)
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? '',
        role: finalRole,
        roleEntityId: finalRoleEntityId ?? null,
      },
    });
  } catch (err: any) {
    // Prisma enum validation or other known errors should return JSON with helpful message
    const msg = err?.message?.toString?.() ?? 'internal error';
    if (/Expected Role|Invalid `role`/.test(msg)) {
      return NextResponse.json({ error: 'invalid role value' , detail: msg }, { status: 400 });
    }
    console.error('[users.route.POST] create user failed:', err);
    return NextResponse.json({ error: 'failed to create user' }, { status: 500 });
  }

  await createAudit({
    actorId: null,
    action: 'user.create',
    resource: 'User',
    resourceId: user.id,
    meta: { email, role: finalRole, roleEntityId: finalRoleEntityId ?? null },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}

import { getServerSession } from 'next-auth/next';
import type { NextRequest } from 'next/server';
import { authOptions } from './auth';
import { createAudit } from '@/services/audit.service';
import * as authService from '@/services/auth.service';
import { prisma } from '@/lib/prisma';
export type SessionWithPerms = {
  user: { id: string; email: string; role: string; permissions?: string[] };
};

// Accept either Next.js' NextRequest or the standard Web Request used in App Router API handlers.
export async function getSession(_req?: Request | NextRequest) {
  // We intentionally don't pass the request to NextAuth here (server-side session retrieval works without it).
  return (await getServerSession(authOptions)) as unknown as SessionWithPerms | null;
}

export async function requirePermission(req: Request | NextRequest | undefined, permission: string, actorId?: string) {
  const session = await getSession(req);
  const sid = session?.user?.id ?? actorId ?? null;

  console.log(`[requirePermission] Checking permission "${permission}" for user ${session?.user?.email} (role: ${session?.user?.role})`);
  console.log(`[requirePermission] User permissions:`, session?.user?.permissions);

  if (session?.user?.permissions?.includes(permission)) {
    console.log(`[requirePermission] ✓ Permission granted`);
    return { session, usedOverride: false };
  }

  console.log(`[requirePermission] ✗ Permission denied - "${permission}" not found in user permissions`);

  // try emergency override (token expected in header 'x-override-token')
  try {
    if (!req) throw new Error('No request provided for override check');
    const token = (req as Request).headers.get('x-override-token');
    if (!token) throw new Error('No override token');
    const override = await authService.consumeEmergencyOverride(token);
    await createAudit({ actorId: sid, action: 'emergency.override.used', resource: 'EmergencyOverride', resourceId: override.id, meta: { reason: override.reason } });
    return { session: session ?? null, usedOverride: true };
  } catch (err) {
    throw new Error(`Forbidden: User does not have permission "${permission}"`);
  }
}

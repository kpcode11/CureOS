import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { requirePermission } from '@/lib/authorization';
import { createEmergencyOverride } from '@/services/auth.service';
import { createAudit } from '@/services/audit.service';

export async function POST(req: Request) {
  const body = await req.json();
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // only users with emergency.request OR ADMIN can create override
  try {
    // pass the incoming Request so headers (x-override-token) can be inspected
    await requirePermission(req, 'emergency.request', session.user.id);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { reason, targetUserId, ttlMinutes } = body;
  if (!reason || reason.length < 5) return NextResponse.json({ error: 'Provide a short reason' }, { status: 400 });

  const { token, expiresAt, id } = await createEmergencyOverride({ actorId: session.user.id, reason, targetUserId, ttlMinutes });
  await createAudit({ actorId: session.user.id, action: 'emergency.override.request', resource: 'EmergencyOverride', resourceId: id, meta: { targetUserId, ttlMinutes } });

  return NextResponse.json({ token, expiresAt });
}

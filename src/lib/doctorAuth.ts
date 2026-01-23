// src/lib/doctorAuth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns { user, doctor } for the logged-in doctor.
 *
 * DEV BYPASS (local only):
 * - Enable by setting DEV_AUTH_BYPASS=true in .env.local
 * - Then send header: x-dev-user-email: doctor@cureos.com
 *
 * IMPORTANT: remove/disable bypass before production.
 */
export async function requireDoctor(req?: Request) {
  // -----------------------------
  // DEV BYPASS (local only)
  // -----------------------------
  const bypassEnabled =
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_AUTH_BYPASS ?? "false") === "true";

  const devEmail = req?.headers
    .get("x-dev-user-email")
    ?.trim()
    ?.toLowerCase();

  if (bypassEnabled && devEmail) {
    const user = await prisma.user.findUnique({ where: { email: devEmail } });

    if (!user) {
      throw new Response(JSON.stringify({ error: "Dev user not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (user.role !== "DOCTOR") {
      throw new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });

    if (!doctor) {
      throw new Response(JSON.stringify({ error: "Doctor profile not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    return { user, doctor };
  }

  // -----------------------------
  // NextAuth session path
  // -----------------------------
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // Try to resolve user by id if present, else by email.
  const sessionUserAny = session.user as any;
  const sessionUserId: string | undefined = sessionUserAny?.id;

  const sessionEmail = session.user.email.trim().toLowerCase();

  const user = sessionUserId
    ? await prisma.user.findUnique({ where: { id: sessionUserId } })
    : await prisma.user.findUnique({ where: { email: sessionEmail } });

  if (!user) {
    throw new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  if (user.role !== "DOCTOR") {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
  });

  if (!doctor) {
    throw new Response(JSON.stringify({ error: "Doctor profile not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  return { user, doctor };
}

export async function writeAudit(params: {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: any;
  after?: any;
  meta?: any;
  ip?: string | null;
}) {
  const { actorId, action, resource, resourceId, before, after, meta, ip } = params;

  // Audit is non-blocking: if it fails, ignore
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        before: before ?? undefined,
        after: after ?? undefined,
        meta: meta ?? undefined,
        ip: ip ?? null,
      },
    });
  } catch {
    // ignore
  }
}

/** Best-effort IP extraction */
export function getRequestIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return null;
}

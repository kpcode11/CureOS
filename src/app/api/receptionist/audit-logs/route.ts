import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

// GET /api/receptionist/audit-logs?take=50&skip=0
export async function GET(req: Request) {
  try {
    await requirePermission(req, "audit.read");
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? 100), 500);
  const skip = Number(url.searchParams.get("skip") ?? 0);

  // scope to receptionist-relevant actions for safety
  const where = {
    OR: [
      { action: { contains: "receptionist." } },
      { resource: "Appointment" },
      { resource: "Patient" },
      { resource: "Emergency" },
    ],
  } as any;

  const [rows, count] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ rows, count });
}

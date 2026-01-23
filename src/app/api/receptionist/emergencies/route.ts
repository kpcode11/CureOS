import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createAudit } from "@/services/audit.service";

// POST /api/receptionist/emergencies
// Rapid intake for critical walk-ins. Minimal required fields to save time.
export async function POST(req: Request) {
  let actorId: string | null = null;
  try {
    const res = await requirePermission(req, "emergency.create");
    actorId = res.session?.user?.id ?? null;
  } catch (err) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.patientName || !body.condition || !body.severity) {
    return NextResponse.json({ error: "Missing required fields (patientName, condition, severity)" }, { status: 400 });
  }

  const rec = await prisma.emergency.create({
    data: {
      patientName: body.patientName,
      condition: body.condition,
      severity: body.severity,
      notes: body.notes || null,
      status: body.status || "ACTIVE",
    },
  });

  await createAudit({ actorId, action: "receptionist.emergency.create", resource: "Emergency", resourceId: rec.id, meta: { patientName: rec.patientName, severity: rec.severity } });

  return NextResponse.json(rec);
}
